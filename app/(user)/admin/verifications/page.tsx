"use client";

import { useEffect, useMemo, useState } from "react";
import Modal from "@/components/Modal";
import { Select } from "@/components/Select";
import { useToast } from "@/hooks/useToast";
import { useAuth, getUserId } from "@/lib/auth";
import {
  getProducts,
  getVerifications,
  createVerification,
  updateVerification,
  patchProduct,
} from "@/lib/api";
import type {
  AuthStatus,
  Product,
  Verification,
  VerificationStageStatus,
} from "@/lib/types";

const STATUS_FILTERS = [
  { value: "PENDING", label: "Pendientes" },
  { value: "NOT_SUBMITTED", label: "Sin enviar" },
  { value: "AUTHENTICATED", label: "Autenticados" },
  { value: "REJECTED", label: "Rechazados" },
  { value: "", label: "Todos" },
];

const AUTH_LABELS: Record<AuthStatus, string> = {
  NOT_SUBMITTED: "SIN ENVIAR",
  PENDING: "PENDIENTE",
  AUTHENTICATED: "AUTENTICADO",
  REJECTED: "RECHAZADO",
};

const STAGE_LABELS: Record<string, string> = {
  materialCheck: "Material",
  constructionCheck: "Construcción",
  factoryCodeCheck: "Código de fábrica",
  finalInspection: "Inspección final",
};

const STAGE_KEYS = [
  "materialCheck",
  "constructionCheck",
  "factoryCodeCheck",
  "finalInspection",
] as const;

const STAGE_SHORT_LABELS: Record<string, string> = {
  materialCheck: "MAT",
  constructionCheck: "CON",
  factoryCodeCheck: "COD",
  finalInspection: "FIN",
};

interface StageForm {
  materialCheck: VerificationStageStatus;
  constructionCheck: VerificationStageStatus;
  factoryCodeCheck: VerificationStageStatus;
  finalInspection: VerificationStageStatus;
  notes: string;
}

const DEFAULT_FORM: StageForm = {
  materialCheck: "PENDING",
  constructionCheck: "PENDING",
  factoryCodeCheck: "PENDING",
  finalInspection: "PENDING",
  notes: "",
};

function authPill(auth: AuthStatus) {
  if (auth === "AUTHENTICATED") return "pill green";
  if (auth === "PENDING") return "pill yellow";
  if (auth === "REJECTED") return "pill red";
  return "pill";
}

function stagePill(status: VerificationStageStatus) {
  if (status === "PASSED") return "pill green";
  if (status === "FAILED") return "pill red";
  return "pill";
}

function stageText(status: VerificationStageStatus) {
  if (status === "PASSED") return "OK";
  if (status === "FAILED") return "FALLIDO";
  return "PEND";
}

function deriveResult(form: StageForm): AuthStatus {
  const stages = STAGE_KEYS.map((k) => form[k]);

  if (stages.some((s) => s === "FAILED")) {
    return "REJECTED";
  }

  if (stages.every((s) => s === "PASSED")) {
    return "AUTHENTICATED";
  }

  return "PENDING";
}

function getStageIcon(status: VerificationStageStatus) {
  if (status === "PASSED")
    return { icon: "✓", color: "var(--success, #22c55e)" };
  if (status === "FAILED")
    return { icon: "✕", color: "var(--danger, #ef4444)" };
  return { icon: "—", color: "var(--text-mute)" };
}

function StageToggle({
  label,
  value,
  onChange,
}: {
  label: string;
  value: VerificationStageStatus;
  onChange: (v: VerificationStageStatus) => void;
}) {
  const opts: { val: VerificationStageStatus; text: string; color: string }[] =
    [
      { val: "PASSED", text: "✓ OK", color: "var(--success, #22c55e)" },
      { val: "PENDING", text: "— PEND", color: "var(--accent-2)" },
      { val: "FAILED", text: "✗ FAIL", color: "var(--danger, #ef4444)" },
    ];

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "10px 0",
        borderBottom: "1px solid var(--border)",
      }}
    >
      <span className="mono" style={{ fontSize: 12 }}>
        {label.toUpperCase()}
      </span>
      <div style={{ display: "flex", gap: 6 }}>
        {opts.map(({ val, text, color }) => (
          <button
            key={val}
            type="button"
            onClick={() => onChange(val)}
            style={{
              padding: "4px 10px",
              fontSize: 11,
              fontFamily: "var(--font-mono)",
              border: "1px solid",
              cursor: "pointer",
              borderColor: value === val ? color : "var(--border)",
              background: value === val ? `${color}22` : "transparent",
              color: value === val ? color : "var(--text-mute)",
            }}
          >
            {text}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function AdminVerificationsPage() {
  const { session } = useAuth();
  const { show, ToastContainer } = useToast();

  const [products, setProducts] = useState<Product[]>([]);
  const [verifications, setVerifications] = useState<Verification[]>([]);
  const [loading, setLoading] = useState(true);

  const [statusFilter, setStatusFilter] = useState<AuthStatus | "">("PENDING");
  const [query, setQuery] = useState("");

  const [verifyProduct, setVerifyProduct] = useState<Product | null>(null);
  const [form, setForm] = useState<StageForm>(DEFAULT_FORM);
  const [submitting, setSubmitting] = useState(false);

  const [detailVerif, setDetailVerif] = useState<Verification | null>(null);

  const [editingVerification, setEditingVerification] =
    useState<Verification | null>(null);

  async function loadData() {
    if (!session) return;
    setLoading(true);
    try {
      const [prods, verifs] = await Promise.all([
        getProducts(),
        getVerifications(session.accessToken),
      ]);
      setProducts(prods);
      setVerifications(verifs);
    } catch {
      show("No se pudieron cargar los datos.", "error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, [session]);

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products
      .filter((p) => !statusFilter || p.auth === statusFilter)
      .filter(
        (p) => !q || `${p.name} ${p.sku} ${p.brand}`.toLowerCase().includes(q),
      )
      .sort((a, b) => {
        if (a.auth === "PENDING" && b.auth !== "PENDING") return -1;
        if (a.auth !== "PENDING" && b.auth === "PENDING") return 1;
        return a.name.localeCompare(b.name);
      });
  }, [products, query, statusFilter]);

  function count(status: AuthStatus) {
    return products.filter((p) => p.auth === status).length;
  }

  function verifOf(productId: string) {
    return verifications.find((v) => v.productId === productId) ?? null;
  }

  async function handleSubmit() {
    console.log("--- INICIO SUBMIT ---");
    console.log("verifyProduct:", verifyProduct);
    console.log("editingVerification:", editingVerification);
    console.log("form:", form);

    if (!session || !verifyProduct) {
      console.error("Fallo de validación inicial: Sin sesión o sin verifyProduct");
      return;
    }

    const userId = getUserId(session);
    if (!userId) {
      console.error("Fallo: No se pudo obtener el userId");
      show("No se pudo obtener tu sesión.", "error");
      return;
    }

    setSubmitting(true);

    try {
      const payload = {
        productId: verifyProduct.id,
        verifiedBy: userId,
        materialCheck: form.materialCheck,
        constructionCheck: form.constructionCheck,
        factoryCodeCheck: form.factoryCodeCheck,
        finalInspection: form.finalInspection,
        notes: form.notes || null,
      };

      if (editingVerification) {
        console.log("Acción: UPDATE", editingVerification.id);
        await updateVerification(editingVerification.id, payload, session.accessToken);
      } else {
        console.log("Acción: CREATE (nuevo registro)");
        await createVerification(payload, session.accessToken);
      }

      const result = deriveResult(form);
      console.log("Resultado calculado:", result);

      await patchProduct(verifyProduct.id, { authStatus: result }, session.accessToken);
      console.log("Producto actualizado en back");

      await loadData();
      console.log("Datos recargados");

      setVerifyProduct(null);
      setEditingVerification(null);
      setForm(DEFAULT_FORM);
      
      show(`${verifyProduct.name} → ${AUTH_LABELS[result]}`, "success");
    } catch (err) {
      console.error("ERROR en catch:", err);
      show("Error al guardar la verificación.", "error");
    } finally {
      console.log("--- FIN SUBMIT (finally) ---");
      setSubmitting(false);
    }
  }
  
  const expectedResult = deriveResult(form);

  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
          gap: 16,
          flexWrap: "wrap",
          marginBottom: 28,
        }}
      >
        <div>
          <div className="eyebrow" style={{ color: "var(--accent-2)" }}>
            ◆ OPERACIONES
          </div>
          <h1 className="display" style={{ fontSize: 40, marginTop: 8 }}>
            VERIFICACIONES
          </h1>
          <div className="mono mute" style={{ marginTop: 8, fontSize: 12 }}>
            {count("PENDING")} PRODUCTO{count("PENDING") === 1 ? "" : "S"}{" "}
            ESPERANDO VERIFICACIÓN
          </div>
        </div>
        <div
          style={{
            display: "flex",
            gap: 10,
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          <input
            className="input"
            placeholder="Buscar producto, SKU o marca..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{ width: 280 }}
          />
          <Select
            value={statusFilter}
            onChange={(v) => setStatusFilter(v as AuthStatus | "")}
            width={180}
            ariaLabel="Filtrar por estado"
            options={STATUS_FILTERS}
          />
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
          gap: 12,
          marginBottom: 24,
        }}
      >
        {(
          [
            "PENDING",
            "NOT_SUBMITTED",
            "AUTHENTICATED",
            "REJECTED",
          ] as AuthStatus[]
        ).map((s) => (
          <button
            key={s}
            type="button"
            className="card"
            onClick={() => setStatusFilter(statusFilter === s ? "" : s)}
            style={{
              padding: 16,
              textAlign: "left",
              cursor: "pointer",
              borderColor:
                statusFilter === s ? "var(--accent-2)" : "var(--border)",
            }}
          >
            <div className="mono mute" style={{ fontSize: 11 }}>
              {AUTH_LABELS[s]}
            </div>
            <div
              className="display"
              style={{ fontSize: 28, marginTop: 8, color: "var(--text)" }}
            >
              {count(s)}
            </div>
          </button>
        ))}
      </div>

      <div className="card" style={{ padding: 0, overflowX: "auto" }}>
        <table className="table">
          <thead>
            <tr>
              <th>Producto</th>
              <th>SKU</th>
              <th>Marca</th>
              <th>Estado</th>
              <th>Protocolo</th>
              <th style={{ textAlign: "right" }}>Acción</th>
            </tr>
          </thead>
          <tbody>
            {shown.map((product) => {
              const verif = verifOf(product.id);
              return (
                <tr key={product.id}>
                  <td>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                        minWidth: 220,
                      }}
                    >
                      <img
                        src={product.images[0] ?? "/placeholder.svg"}
                        alt={product.name}
                        style={{
                          width: 42,
                          height: 42,
                          objectFit: "cover",
                          border: "1px solid var(--border)",
                        }}
                      />
                      <span
                        style={{
                          fontFamily: "var(--font-display)",
                          fontSize: 13,
                        }}
                      >
                        {product.name}
                      </span>
                    </div>
                  </td>
                  <td>
                    <span className="mono mute">{product.sku}</span>
                  </td>
                  <td>
                    <span className="mono mute">{product.brand}</span>
                  </td>
                  <td>
                    <span className={authPill(product.auth)}>
                      {AUTH_LABELS[product.auth]}
                    </span>
                  </td>
                  <td>
                    {verif ? (
                      <div
                        style={{ display: "flex", gap: 12, flexWrap: "wrap" }}
                      >
                        {STAGE_KEYS.map((k) => {
                          const { icon, color } = getStageIcon(verif[k]);
                          return (
                            <div
                              key={k}
                              title={STAGE_LABELS[k]}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 4,
                                fontSize: 11,
                                fontFamily: "var(--font-mono)",
                                cursor: "help",
                              }}
                            >
                              <span style={{ color: "var(--text-mute)" }}>
                                {STAGE_SHORT_LABELS[k]}
                              </span>
                              <span
                                style={{
                                  color,
                                  fontWeight: "bold",
                                  fontSize: 13,
                                }}
                              >
                                {icon}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <span className="mono mute" style={{ fontSize: 11 }}>
                        —
                      </span>
                    )}
                  </td>
                  <td style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                    {verif ? (
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "flex-end",
                          gap: 6,
                        }}
                      >
                        <button
                          type="button"
                          className="mono"
                          onClick={() => setDetailVerif(verif)}
                          style={{
                            padding: "4px 10px",
                            fontSize: 11,
                            border: "1px solid var(--border)",
                            background: "var(--surface-2, transparent)",
                            color: "var(--text)",
                            cursor: "pointer",
                          }}
                        >
                          VER
                        </button>
                        {product.auth === "PENDING" && (
                          <button
                            type="button"
                            className="mono"
                            onClick={() => {
                              setEditingVerification(verif);
                              setVerifyProduct(product);
                              setForm({
                                materialCheck: verif.materialCheck,
                                constructionCheck: verif.constructionCheck,
                                factoryCodeCheck: verif.factoryCodeCheck,
                                finalInspection: verif.finalInspection,
                                notes: verif.notes ?? "",
                              });
                            }}
                            style={{
                              padding: "4px 10px",
                              fontSize: 11,
                              border: "1px solid var(--border)",
                              background: "var(--surface-2, transparent)",
                              color: "var(--text)",
                              cursor: "pointer",
                            }}
                          >
                            EDITAR
                          </button>
                        )}
                      </div>
                    ) : product.auth === "PENDING" ? (
                      <button
                        type="button"
                        className="mono"
                        onClick={() => {
                          setVerifyProduct(product);
                          setEditingVerification(null);
                          setForm(DEFAULT_FORM);
                        }}
                        style={{
                          padding: "4px 10px",
                          fontSize: 11,
                          border: "1px solid var(--border)",
                          background: "var(--surface-2, transparent)",
                          color: "var(--text)",
                          cursor: "pointer",
                        }}
                      >
                        INICIAR VERIFICACIÓN
                      </button>
                    ) : (
                      <span className="mono mute" style={{ fontSize: 11 }}>
                        —
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {loading && (
          <div
            className="mono mute"
            style={{ padding: 32, textAlign: "center", fontSize: 13 }}
          >
            Cargando...
          </div>
        )}
        {!loading && shown.length === 0 && (
          <div
            className="mono mute"
            style={{ padding: 32, textAlign: "center", fontSize: 13 }}
          >
            Sin productos para este filtro.
          </div>
        )}
      </div>

      <Modal
        open={verifyProduct !== null}
        title="PROTOCOLO DE VERIFICACIÓN"
        onClose={() => {
          if (!submitting) {
            setVerifyProduct(null);
            setEditingVerification(null);
            setForm(DEFAULT_FORM);
          }
        }}
        width={520}
      >
        {verifyProduct && (
          <div>
            <div
              style={{
                padding: "10px 12px",
                background: "var(--surface-2, var(--bg-2))",
                border: "1px solid var(--border)",
                marginBottom: 20,
              }}
            >
              <div className="mono mute" style={{ fontSize: 11 }}>
                PRODUCTO
              </div>
              <div
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: 15,
                  marginTop: 4,
                }}
              >
                {verifyProduct.name}
              </div>
              <div className="mono mute" style={{ fontSize: 11, marginTop: 2 }}>
                {verifyProduct.sku} · {verifyProduct.brand}
              </div>
            </div>

            <div
              className="mono mute"
              style={{ fontSize: 11, marginBottom: 8 }}
            >
              ETAPAS DEL PROTOCOLO
            </div>
            {STAGE_KEYS.map((k) => (
              <StageToggle
                key={k}
                label={STAGE_LABELS[k]}
                value={form[k]}
                onChange={(v) => setForm((prev) => ({ ...prev, [k]: v }))}
              />
            ))}

            <div style={{ marginTop: 16 }}>
              <div
                className="mono mute"
                style={{ fontSize: 11, marginBottom: 6 }}
              >
                NOTAS (OPCIONAL)
              </div>
              <textarea
                className="input"
                placeholder="Observaciones del verificador..."
                value={form.notes}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, notes: e.target.value }))
                }
                rows={3}
                style={{
                  width: "100%",
                  resize: "vertical",
                  fontFamily: "var(--font-mono)",
                  fontSize: 12,
                }}
              />
            </div>

            <div
              style={{
                marginTop: 16,
                padding: "10px 12px",
                background: "var(--surface-2, var(--bg-2))",
                border: "1px solid var(--border)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span className="mono mute" style={{ fontSize: 11 }}>
                RESULTADO ESPERADO
              </span>
              <span
                className={
                  expectedResult === "AUTHENTICATED"
                    ? "pill green"
                    : expectedResult === "REJECTED"
                      ? "pill red"
                      : "pill yellow"
                }
              >
                {expectedResult === "AUTHENTICATED"
                  ? "AUTENTICADO"
                  : expectedResult === "REJECTED"
                    ? "RECHAZADO"
                    : "PENDIENTE"}
              </span>
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: 10,
                marginTop: 20,
              }}
            >
              <button
                className="btn btn-ghost"
                onClick={() => {
                  setVerifyProduct(null);
                  setEditingVerification(null);
                  setForm(DEFAULT_FORM);
                }}
                disabled={submitting}
              >
                Cancelar
              </button>
              <button
                className="btn"
                onClick={handleSubmit}
                disabled={submitting}
              >
                {submitting
                  ? "Guardando..."
                  : editingVerification
                    ? "Actualizar verificación"
                    : "Registrar verificación"}
              </button>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        open={detailVerif !== null}
        title="DETALLE DE VERIFICACIÓN"
        onClose={() => setDetailVerif(null)}
        width={640}
      >
        {detailVerif && (
          <div>
            <div
              style={{
                padding: "16px 20px",
                background: "var(--surface-2, var(--bg-2))",
                border: "1px solid var(--border)",
                marginBottom: 24,
              }}
            >
              <div className="mono mute" style={{ fontSize: 13 }}>
                PRODUCTO
              </div>
              <div
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: 20,
                  marginTop: 6,
                }}
              >
                {detailVerif.productName}
              </div>
              <div className="mono mute" style={{ fontSize: 14, marginTop: 8 }}>
                Verificado por: {detailVerif.verifiedByFirstName}{" "}
                {detailVerif.verifiedByLastName}
              </div>
              {detailVerif.verifiedAt && (
                <div
                  className="mono mute"
                  style={{ fontSize: 14, marginTop: 4 }}
                >
                  Fecha:{" "}
                  {new Date(detailVerif.verifiedAt).toLocaleDateString("es-SV")}
                </div>
              )}
            </div>

            <div
              className="mono mute"
              style={{ fontSize: 14, marginBottom: 12 }}
            >
              ETAPAS
            </div>
            {STAGE_KEYS.map((k) => (
              <div
                key={k}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "12px 0",
                  borderBottom: "1px solid var(--border)",
                }}
              >
                <span className="mono" style={{ fontSize: 15 }}>
                  {STAGE_LABELS[k].toUpperCase()}
                </span>

                <span
                  className={stagePill(detailVerif[k])}
                  style={{ fontSize: 14, padding: "4px 12px" }}
                >
                  {stageText(detailVerif[k])}
                </span>
              </div>
            ))}

            {detailVerif.notes && (
              <div style={{ marginTop: 24 }}>
                <div
                  className="mono mute"
                  style={{ fontSize: 14, marginBottom: 8 }}
                >
                  NOTAS
                </div>
                <p
                  style={{
                    fontSize: 16,
                    color: "var(--text-mute)",
                    lineHeight: 1.6,
                  }}
                >
                  {detailVerif.notes}
                </p>
              </div>
            )}

            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                marginTop: 28,
              }}
            >
              <button
                className="btn btn-ghost"
                onClick={() => setDetailVerif(null)}
                style={{ fontSize: 15, padding: "8px 16px" }}
              >
                Cerrar
              </button>
            </div>
          </div>
        )}
      </Modal>

      <ToastContainer />
    </div>
  );
}
