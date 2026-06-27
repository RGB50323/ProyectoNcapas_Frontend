"use client";

import { PageLoader } from "@/components/PageLoader";
import { useAuth, authFetch } from "@/lib/auth";
import { formatSvPhone, cleanPhone, isValidPhone, hasLocalNumber } from "@/lib/phone";
import {
  getMyStoreRequest,
  getStoreCategories,
  createStoreRequest,
  STORE_CATEGORY_LABELS,
  STORE_STATUS_LABELS,
  type StoreRequest,
  type StoreRequestStatus,
  type StoreCategory,
} from "@/lib/storeRequest";
import { Select } from "@/components/Select";
import Modal from "@/components/Modal";
import { useToast } from "@/hooks/useToast";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

function decodeJwtPayload(token: string): Record<string, unknown> {
  try {
    const base64 = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(atob(base64));
  } catch {
    return {};
  }
}

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("es-SV", { day: "numeric", month: "short", year: "numeric" });
}

function friendlyError(status: number, msg: string | null): string {
  if (status === 401) return "Tu sesión expiró. Vuelve a iniciar sesión.";
  if (!msg) return `Error ${status}`;
  if (msg.includes("Phone already exists")) return "Ese teléfono ya está registrado en otra cuenta.";
  if (msg.includes("Email already exists")) return "Ese correo ya está registrado en otra cuenta.";
  return msg;
}

function StatusBadge({ status }: { status: StoreRequestStatus }) {
  const color =
    status === "APROBADA"
      ? "var(--ok)"
      : status === "RECHAZADA"
        ? "var(--danger, #e05252)"
        : "var(--accent-2)";
  return (
    <span
      style={{
        fontFamily: "var(--font-mono)",
        fontSize: 13,
        letterSpacing: "0.12em",
        color,
        border: `1px solid ${color}`,
        padding: "2px 8px",
      }}
    >
      {STORE_STATUS_LABELS[status].toUpperCase()}
    </span>
  );
}

function StoreSummary({ req }: { req: StoreRequest }) {
  const rows = [
    { label: "TIENDA", value: req.storeName },
    { label: "RUBRO", value: STORE_CATEGORY_LABELS[req.storeCategory] },
    { label: "UBICACIÓN", value: req.location },
    { label: "VENTAS/MES", value: String(req.monthlySalesEstimate) },
  ];
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px 24px" }}>
      {rows.map((r) => (
        <div key={r.label}>
          <div className="mono mute" style={{ fontSize: 11, marginBottom: 6 }}>
            {r.label}
          </div>
          <div style={{ fontSize: 14, color: "var(--text-dim)" }}>{r.value}</div>
        </div>
      ))}
    </div>
  );
}

export default function Profile() {
  const router = useRouter();
  const { session, loading } = useAuth();

  const { show, ToastContainer } = useToast();

  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState(() => ({
    firstName: session?.firstName ?? "",
    lastName: session?.lastName ?? "",
    email: session?.email ?? "",
    phone: (session as any)?.phone ?? "",
  }));

  const [storeReq, setStoreReq] = useState<StoreRequest | null>(null);
  const [reqLoading, setReqLoading] = useState(true);
  const [categories, setCategories] = useState<StoreCategory[]>([]);

  const [applyOpen, setApplyOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [applyError, setApplyError] = useState<string | null>(null);
  const [applyForm, setApplyForm] = useState({
    storeName: "",
    storeDescription: "",
    storeCategory: "" as StoreCategory | "",
    location: "",
    monthlySalesEstimate: "",
  });

  useEffect(() => {
    if (session) {
      setForm({
        firstName: session.firstName,
        lastName: session.lastName ?? "",
        email: session.email,
        phone: (session as any).phone ?? "",
      });
    }
  }, [session]);

  useEffect(() => {
    if (!session) return;
    if (session.role !== "BUYER") {
      setReqLoading(false);
      return;
    }
    let active = true;
    Promise.all([getMyStoreRequest(session), getStoreCategories(session)])
      .then(([req, cats]) => {
        if (!active) return;
        setStoreReq(req);
        setCategories(cats);
      })
      .catch(() => {})
      .finally(() => {
        if (active) setReqLoading(false);
      });
    return () => {
      active = false;
    };
  }, [session]);

  if (loading) return <PageLoader />;
  if (!session) {
    router.replace("/login");
    return null;
  }

  const initials = `${session.firstName[0]}${session.lastName?.[0] ?? ""}`.toUpperCase();
  const isBuyer = session.role === "BUYER";
  const isSeller = session.role === "SELLER";
  const isAdmin = session.role === "ADMIN";
  const hasPhone = !!(session as any).phone && String((session as any).phone).trim() !== "";

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  function handleCancel() {
    setForm({
      firstName: session!.firstName,
      lastName: session!.lastName ?? "",
      email: session!.email,
      phone: (session as any)?.phone ?? "",
    });
    setEditing(false);
  }

  function startEditPhone() {
    setForm((prev) => ({
      ...prev,
      phone: prev.phone ? formatSvPhone(prev.phone) : "+503 ",
    }));
    setEditing(true);
  }

  async function handleSave() {
    setSaving(true);
    try {
      const payload = decodeJwtPayload(session!.accessToken);
      const userId = payload.userId as string;
      if (!userId) {
        show("No se pudo obtener tu ID de usuario.", "error");
        return;
      }

      const phoneProvided = hasLocalNumber(form.phone);
      if (phoneProvided && !isValidPhone(form.phone)) {
        show("Teléfono inválido. Formato: +503 XXXX-XXXX", "error");
        return;
      }

      const body = {
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        ...(phoneProvided ? { phone: cleanPhone(form.phone) } : {}),
      };

      const res = await authFetch(`/users/update/${userId}`, session!, {
        method: "PUT",
        body: JSON.stringify(body),
      });

      const json = await res.json().catch(() => null);
      if (!res.ok) {
        const msg = json?.message;
        const text = typeof msg === "string" ? msg : msg && typeof msg === "object" ? Object.values(msg).join(". ") : null;
        show(friendlyError(res.status, text), "error");
        return;
      }

      const updated = json?.data;
      if (updated?.accessToken) {
        const newSession = { ...session, ...updated };
        localStorage.setItem("klab_session", JSON.stringify(newSession));
      }

      show("Información actualizada", "success");
      window.location.reload();
    } catch {
      show("No se pudo conectar con el servidor.", "error");
    } finally {
      setSaving(false);
    }
  }

  function openApply() {
    setApplyError(null);
    setApplyForm({
      storeName: storeReq?.storeName ?? "",
      storeDescription: storeReq?.storeDescription ?? "",
      storeCategory: (storeReq?.storeCategory as StoreCategory) ?? "",
      location: storeReq?.location ?? "",
      monthlySalesEstimate: storeReq ? String(storeReq.monthlySalesEstimate) : "",
    });
    setApplyOpen(true);
  }

  async function handleApply(e: React.FormEvent) {
    e.preventDefault();
    setApplyError(null);

    if (!applyForm.storeName.trim()) return setApplyError("El nombre de la tienda es requerido");
    if (!applyForm.storeDescription.trim()) return setApplyError("La descripción es requerida");
    if (!applyForm.storeCategory) return setApplyError("Selecciona el rubro de la tienda");
    if (!applyForm.location.trim()) return setApplyError("La ubicación es requerida");
    const sales = Number(applyForm.monthlySalesEstimate);
    if (!Number.isFinite(sales) || sales < 0) return setApplyError("Ingresa un estimado de ventas válido");

    setSubmitting(true);
    try {
      const created = await createStoreRequest(session!, {
        storeName: applyForm.storeName.trim(),
        storeDescription: applyForm.storeDescription.trim(),
        storeCategory: applyForm.storeCategory as StoreCategory,
        location: applyForm.location.trim(),
        monthlySalesEstimate: sales,
      });
      setStoreReq(created);
      setApplyOpen(false);
    } catch (err: any) {
      setApplyError(err.message ?? "Error al enviar la solicitud.");
    } finally {
      setSubmitting(false);
    }
  }

  const displayName = editing
    ? `${form.firstName} ${form.lastName}`.toUpperCase()
    : `${session.firstName.toUpperCase()} ${session.lastName?.toUpperCase() ?? ""}`;

  return (
    <div className="container" style={{ paddingBlock: 48 }}>
      <ToastContainer />
      <div className="mono mute" style={{ marginBottom: 16, fontSize: 12 }}>
        {isSeller || isAdmin ? "Consola" : "Cuenta"} / Mi cuenta
      </div>

      <button
        className="btn btn-ghost"
        style={{ marginBottom: 24, padding: "8px 14px", fontSize: 11 }}
        onClick={() => router.push(isSeller ? "/seller/dashboard" : isAdmin ? "/admin/dashboard" : "/account")}
      >
        ← {isSeller || isAdmin ? "Consola" : "Cuenta"}
      </button>

      <div
        className="card"
        style={{
          padding: 0,
          marginBottom: 24,
          overflow: "hidden",
          borderBottom: "1px solid var(--border)",
        }}
      >
        <div style={{ height: 3, background: "var(--accent-2)" }} />
        <div
          style={{
            padding: "32px 36px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 32,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 28 }}>
            <div
              style={{
                width: 80,
                height: 80,
                border: "1px solid var(--border-bright)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: "var(--font-display)",
                fontSize: 28,
                fontWeight: 700,
                color: "var(--text)",
                flexShrink: 0,
                background: "var(--elev)",
                letterSpacing: "0.04em",
              }}
            >
              {initials}
            </div>
            <div>
              <h1 className="display" style={{ fontSize: 48, lineHeight: 0.92, marginBottom: 12 }}>
                {displayName}
              </h1>
              <p className="mono mute" style={{ fontSize: 12 }}>
                {editing ? form.email : session.email}
                <span
                  style={{
                    display: "inline-block",
                    marginLeft: 12,
                    padding: "2px 8px",
                    border: "1px solid var(--border)",
                    fontSize: 10,
                    letterSpacing: "0.12em",
                    color: "var(--text-mute)",
                  }}
                >
                  {session.role}
                </span>
              </p>
            </div>
          </div>
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 1.3fr) minmax(0, 1fr)",
          gap: 16,
          alignItems: "stretch",
        }}
      >
        <div className="card" style={{ padding: 28 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 24,
              paddingBottom: 16,
              borderBottom: "1px solid var(--border)",
            }}
          >
            <h2 className="display" style={{ fontSize: 18 }}>
              INFORMACIÓN PERSONAL
            </h2>
            {!editing && (
              <button
                className="btn btn-ghost"
                style={{ padding: "8px 14px", fontSize: 11 }}
                onClick={startEditPhone}
              >
                Editar
              </button>
            )}
          </div>

          {editing ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px 24px" }}>
                {(
                  [
                    { label: "NOMBRE", name: "firstName", type: "text" },
                    { label: "APELLIDO", name: "lastName", type: "text" },
                    { label: "CORREO ELECTRÓNICO", name: "email", type: "email" },
                    { label: "TELÉFONO", name: "phone", type: "tel" },
                  ] as const
                ).map((f) => (
                  <div key={f.name}>
                    <div className="mono mute" style={{ fontSize: 11, marginBottom: 6 }}>
                      {f.label}
                    </div>
                    <input
                      className="input"
                      type={f.type}
                      name={f.name}
                      value={form[f.name]}
                      onChange={
                        f.name === "phone"
                          ? (e) => setForm((prev) => ({ ...prev, phone: formatSvPhone(e.target.value) }))
                          : handleChange
                      }
                      placeholder={f.name === "phone" ? "+503 XXXX-XXXX" : f.label}
                      disabled={saving}
                    />
                  </div>
                ))}
              </div>

              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                <button
                  className="btn btn-ghost"
                  style={{ padding: "8px 14px", fontSize: 11 }}
                  onClick={handleCancel}
                  disabled={saving}
                >
                  Cancelar
                </button>
                <button
                  className="btn"
                  style={{ padding: "8px 20px", fontSize: 11 }}
                  onClick={handleSave}
                  disabled={saving}
                >
                  {saving ? "Guardando..." : "Guardar cambios"}
                </button>
              </div>
            </div>
          ) : (
            <div>
              {[
                { label: "NOMBRE", value: session.firstName },
                { label: "APELLIDO", value: session.lastName },
                { label: "CORREO ELECTRÓNICO", value: session.email },
                {
                  label: "TELÉFONO",
                  value: (session as any).phone || (
                    <span style={{ color: "var(--text-mute)", fontStyle: "italic" }}>No registrado</span>
                  ),
                },
              ].map((f, i, arr) => (
                <div
                  key={f.label}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "baseline",
                    gap: 24,
                    padding: "16px 0",
                    borderBottom: i < arr.length - 1 ? "1px solid var(--border)" : "none",
                  }}
                >
                  <div className="mono mute" style={{ fontSize: 11, letterSpacing: "0.12em" }}>
                    {f.label}
                  </div>
                  <div style={{ fontSize: 16, color: "var(--text)", textAlign: "right" }}>{f.value}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          
          {isBuyer && (
            <div className="card" style={{ padding: 28 }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 16,
                  paddingBottom: 16,
                  borderBottom: "1px solid var(--border)",
                }}
              >
                <h2 className="display" style={{ fontSize: 18 }}>
                  CONVERTIRSE EN VENDEDOR
                </h2>
                {storeReq && <StatusBadge status={storeReq.status} />}
              </div>

              {reqLoading ? (
                <p className="mute" style={{ fontSize: 13 }}>
                  Cargando estado de tu solicitud...
                </p>
              ) : !hasPhone ? (
                <div>
                  <p className="mute" style={{ fontSize: 13, marginBottom: 20 }}>
                    Para solicitar tu tienda primero debes completar tu información: agrega tu número de
                    teléfono. Es obligatorio para que el equipo pueda contactarte.
                  </p>
                  <button className="btn" style={{ width: "100%" }} onClick={startEditPhone}>
                    Completar perfil
                  </button>
                </div>
              ) : !storeReq ? (
                <div>
                  <p className="mute" style={{ fontSize: 13, marginBottom: 20 }}>
                    Abre tu propio espacio comercial en K LAB. Envía una solicitud con los datos de tu tienda y
                    nuestro equipo la revisará.
                  </p>
                  <button className="btn" style={{ width: "100%" }} onClick={openApply}>
                    Solicitar registro de tienda
                  </button>
                </div>
              ) : storeReq.status === "PENDIENTE" ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  <p className="mute" style={{ fontSize: 13 }}>
                    Tu solicitud está en revisión. Te avisaremos cuando el equipo la apruebe o rechace.
                  </p>
                  <StoreSummary req={storeReq} />
                  <div className="mono mute" style={{ fontSize: 11 }}>
                    Enviada el {formatDate(storeReq.createdAt)}
                  </div>
                </div>
              ) : storeReq.status === "APROBADA" ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  <p style={{ fontSize: 13, color: "var(--text)" }}>
                    ¡Tu solicitud fue aprobada! Cierra sesión y vuelve a iniciar para acceder a tu consola de
                    tienda.
                  </p>
                  <StoreSummary req={storeReq} />
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  <p className="mute" style={{ fontSize: 13 }}>
                    Tu solicitud fue rechazada por el equipo.
                  </p>
                  {storeReq.reviewNote && (
                    <div
                      style={{
                        fontSize: 13,
                        color: "var(--text-dim)",
                        border: "1px solid var(--border)",
                        padding: 12,
                      }}
                    >
                      <span className="mono mute" style={{ fontSize: 11, display: "block", marginBottom: 4 }}>
                        MOTIVO
                      </span>
                      {storeReq.reviewNote}
                    </div>
                  )}
                  {storeReq.eligibleToReapply ? (
                    <button className="btn" style={{ width: "100%" }} onClick={openApply}>
                      Reenviar solicitud
                    </button>
                  ) : (
                    <div className="mono mute" style={{ fontSize: 11 }}>
                      Podrás volver a aplicar el {formatDate(storeReq.nextEligibleAt)}.
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {isSeller && (
            <div className="card" style={{ padding: 28 }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 16,
                  paddingBottom: 16,
                  borderBottom: "1px solid var(--border)",
                }}
              >
                <h2 className="display" style={{ fontSize: 18 }}>
                  PERFIL DE LA TIENDA
                </h2>
                <span
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: 12,
                    letterSpacing: "0.12em",
                    color: "var(--ok)",
                    border: "1px solid var(--ok)",
                    padding: "2px 8px",
                  }}
                >
                  ● ACTIVA
                </span>
              </div>
              <p className="mute" style={{ fontSize: 13, marginBottom: 20 }}>
                Gestiona la información de tu tienda, catálogo de productos y visualiza tu rendimiento desde el panel de administración.
              </p>
              <button 
                className="btn" 
                style={{ width: "100%" }} 
                onClick={() => router.push("/seller/dashboard")}
              >
                Ir a la consola de tienda
              </button>
            </div>
          )}

          <div className="card" style={{ padding: 28 }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 16,
                paddingBottom: 16,
                borderBottom: "1px solid var(--border)",
              }}
            >
              <h2 className="display" style={{ fontSize: 18 }}>
                SEGURIDAD
              </h2>
              <span
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 12,
                  letterSpacing: "0.12em",
                  color: "var(--ok)",
                  border: "1px solid var(--ok)",
                  padding: "2px 8px",
                }}
              >
                ● ACTIVA
              </span>
            </div>

            <p className="mute" style={{ fontSize: 13, marginBottom: 20 }}>
              Actualiza tus credenciales periódicamente para mantener la cuenta protegida.
            </p>

            <div style={{ display: "flex", gap: 10 }}>
              <button className="btn" style={{ flex: 1 }} onClick={() => router.push("/account/security")}>
                Actualizar contraseña
              </button>
            </div>
          </div>
        </div>
      </div>

      <Modal
        open={applyOpen}
        title="SOLICITAR REGISTRO DE TIENDA"
        onClose={() => {
          if (submitting) return;
          setApplyOpen(false);
          setApplyError(null);
        }}
        width={540}
      >
        <form onSubmit={handleApply} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div>
            <label className="mono mute" style={{ fontSize: 11, display: "block", marginBottom: 6 }}>
              NOMBRE DE LA TIENDA
            </label>
            <input
              className="input"
              type="text"
              value={applyForm.storeName}
              onChange={(e) => setApplyForm((f) => ({ ...f, storeName: e.target.value }))}
              placeholder="Ej. Mr. K"
              disabled={submitting}
            />
          </div>

          <div>
            <label className="mono mute" style={{ fontSize: 11, display: "block", marginBottom: 6 }}>
              RUBRO DE LA TIENDA
            </label>
            <Select
              value={applyForm.storeCategory}
              onChange={(v) => setApplyForm((f) => ({ ...f, storeCategory: v as StoreCategory }))}
              width="100%"
              ariaLabel="Rubro de la tienda"
              placeholder="Selecciona un rubro"
              options={categories.map((c) => ({ value: c, label: STORE_CATEGORY_LABELS[c] }))}
            />
          </div>

          <div>
            <label className="mono mute" style={{ fontSize: 11, display: "block", marginBottom: 6 }}>
              UBICACIÓN
            </label>
            <input
              className="input"
              type="text"
              value={applyForm.location}
              onChange={(e) => setApplyForm((f) => ({ ...f, location: e.target.value }))}
              placeholder="Ej. San Salvador, El Salvador"
              disabled={submitting}
            />
          </div>

          <div>
            <label className="mono mute" style={{ fontSize: 11, display: "block", marginBottom: 6 }}>
              VENTAS PROMEDIO MENSUALES
            </label>
            <input
              className="input"
              type="number"
              min={0}
              value={applyForm.monthlySalesEstimate}
              onChange={(e) => setApplyForm((f) => ({ ...f, monthlySalesEstimate: e.target.value }))}
              placeholder="Cantidad estimada de ventas por mes"
              disabled={submitting}
            />
          </div>

          <div>
            <label className="mono mute" style={{ fontSize: 11, display: "block", marginBottom: 6 }}>
              DESCRIPCIÓN DE LA TIENDA
            </label>
            <textarea
              value={applyForm.storeDescription}
              onChange={(e) => setApplyForm((f) => ({ ...f, storeDescription: e.target.value }))}
              placeholder="Cuéntanos a qué se dedica tu tienda..."
              disabled={submitting}
              style={{
                width: "100%",
                minHeight: 100,
                resize: "vertical",
                background: "transparent",
                color: "var(--text)",
                border: "1px solid var(--border)",
                padding: 12,
                fontFamily: "inherit",
                fontSize: 14,
              }}
            />
          </div>

          {applyError && (
            <p style={{ fontSize: 12, color: "var(--danger, #e05252)", fontFamily: "var(--font-mono)", margin: 0 }}>
              {applyError}
            </p>
          )}

          <div style={{ display: "flex", gap: 12, justifyContent: "flex-end", marginTop: 4 }}>
            <button
              type="button"
              className="btn btn-ghost"
              style={{ padding: "10px 16px", fontSize: 12 }}
              onClick={() => {
                if (submitting) return;
                setApplyOpen(false);
                setApplyError(null);
              }}
              disabled={submitting}
            >
              Cancelar
            </button>
            <button type="submit" className="btn" style={{ padding: "10px 24px", fontSize: 12 }} disabled={submitting}>
              {submitting ? "Enviando..." : "Enviar solicitud"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}