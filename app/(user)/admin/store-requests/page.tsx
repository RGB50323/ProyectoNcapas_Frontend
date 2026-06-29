"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { PageLoader } from "@/components/PageLoader";
import Modal from "@/components/Modal";
import { useToast } from "@/hooks/useToast";
import { usePaged } from "@/hooks/usePaged";
import Pagination from "@/components/Pagination";
import {
  listStoreRequests,
  reviewStoreRequest,
  STORE_CATEGORY_LABELS,
  STORE_STATUS_LABELS,
  type StoreRequest,
  type StoreRequestStatus,
} from "@/lib/storeRequest";

const STATUS_PILL: Record<StoreRequestStatus, string> = {
  PENDIENTE: "yellow",
  APROBADA: "green",
  RECHAZADA: "red",
};

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("es-SV", { day: "numeric", month: "short", year: "numeric" });
}

export default function AdminStoreRequestsPage() {
  const { session, loading } = useAuth();
  const router = useRouter();

  const [requests, setRequests] = useState<StoreRequest[]>([]);
  const { page, setPage, pageItems, pageCount } = usePaged(requests, 10, requests.length);
  const [fetching, setFetching] = useState(true);

  const [detailOpen, setDetailOpen] = useState(false);
  const [selected, setSelected] = useState<StoreRequest | null>(null);
  const [reviewNote, setReviewNote] = useState("");
  const [acting, setActing] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const { show, ToastContainer } = useToast();

  useEffect(() => {
    if (!loading && !session) router.replace("/login");
    if (!loading && session?.role !== "ADMIN") router.replace("/");
  }, [loading, session]);

  useEffect(() => {
    if (!session) return;
    listStoreRequests(session)
      .then((data) => setRequests(data))
      .catch(() => {})
      .finally(() => setFetching(false));
  }, [session]);

  if (loading || fetching) return <PageLoader />;
  if (!session) return null;

  function openDetail(req: StoreRequest) {
    setSelected(req);
    setReviewNote("");
    setActionError(null);
    setDetailOpen(true);
  }

  async function handleReview(decision: "APROBADA" | "RECHAZADA") {
    if (!selected) return;
    if (decision === "RECHAZADA" && !reviewNote.trim()) {
      setActionError("Indica el motivo del rechazo.");
      return;
    }
    setActionError(null);
    setActing(true);
    try {
      const updated = await reviewStoreRequest(session!, selected.id, decision, reviewNote.trim() || undefined);
      setRequests((prev) => prev.map((r) => (r.id === selected.id ? updated : r)));
      setDetailOpen(false);
      show(decision === "APROBADA" ? "Solicitud aprobada" : "Solicitud rechazada", "success");
    } catch (err: any) {
      setActionError(err.message ?? "Error al revisar la solicitud.");
    } finally {
      setActing(false);
    }
  }

  const pending = requests.filter((r) => r.status === "PENDIENTE").length;

  return (
    <div>
      <ToastContainer />
      <div style={{ marginBottom: 24 }}>
        <div className="eyebrow" style={{ color: "var(--accent-2)" }}>
          ◆ GESTIÓN DE PERSONAS
        </div>
        <h1 className="display" style={{ fontSize: 'clamp(28px, 7vw, 40px)', marginTop: 8 }}>
          SOLICITUDES DE TIENDA
        </h1>
      </div>

      <div className="card" style={{ padding: 0 }}>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)" }}>
          <div className="mono mute" style={{ fontSize: 11 }}>
            {requests.length} SOLICITUDES · {pending} PENDIENTES
          </div>
        </div>
        <div style={{ overflowX: "auto" }}>
        <table className="table">
          <thead>
            <tr>
              <th>Tienda</th>
              <th>Solicitante</th>
              <th>Teléfono</th>
              <th>Ventas/mes</th>
              <th>Estado</th>
              <th>Fecha</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {pageItems.map((r) => (
              <tr key={r.id}>
                <td>
                  <div style={{ fontFamily: "var(--font-display)", fontSize: 13 }}>{r.storeName}</div>
                  <div className="mono mute" style={{ fontSize: 11, marginTop: 2 }}>
                    {STORE_CATEGORY_LABELS[r.storeCategory]} · {r.location}
                  </div>
                </td>
                <td>
                  {r.user.firstName} {r.user.lastName}
                  <div className="mono mute" style={{ fontSize: 11, marginTop: 2 }}>
                    {r.user.email}
                  </div>
                </td>
                <td className="mono mute">{r.user.phone ?? "—"}</td>
                <td className="display" style={{ fontSize: 14 }}>
                  {r.monthlySalesEstimate}
                </td>
                <td>
                  <span className={`pill ${STATUS_PILL[r.status]}`}>{STORE_STATUS_LABELS[r.status].toUpperCase()}</span>
                </td>
                <td className="mono mute">{formatDate(r.createdAt)}</td>
                <td style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                  <button
                    className="mono accent"
                    style={{ background: "none", border: "none", cursor: "pointer", fontSize: 11 }}
                    onClick={() => openDetail(r)}
                  >
                    {r.status === "PENDIENTE" ? "REVISAR" : "VER"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
        <Pagination page={page} pageCount={pageCount} onPage={setPage} />
      </div>

      {requests.length === 0 && (
        <div className="card" style={{ padding: 28, textAlign: "center", marginTop: 15 }}>
          <p className="mono mute" style={{ fontSize: 13 }}>
            No hay solicitudes de tienda.
          </p>
        </div>
      )}

      <Modal
        open={detailOpen}
        title="SOLICITUD DE TIENDA"
        onClose={() => {
          if (acting) return;
          setDetailOpen(false);
          setActionError(null);
        }}
        width={560}
      >
        {selected && (
          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 className="display" style={{ fontSize: 22 }}>
                {selected.storeName}
              </h3>
              <span className={`pill ${STATUS_PILL[selected.status]}`}>
                {STORE_STATUS_LABELS[selected.status].toUpperCase()}
              </span>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px 24px" }}>
              {[
                { label: "RUBRO", value: STORE_CATEGORY_LABELS[selected.storeCategory] },
                { label: "UBICACIÓN", value: selected.location },
                { label: "VENTAS/MES", value: String(selected.monthlySalesEstimate) },
                { label: "ENVIADA", value: formatDate(selected.createdAt) },
                { label: "SOLICITANTE", value: `${selected.user.firstName} ${selected.user.lastName}` },
                { label: "TELÉFONO", value: selected.user.phone ?? "—" },
                { label: "EMAIL", value: selected.user.email },
              ].map((f) => (
                <div key={f.label}>
                  <div className="mono mute" style={{ fontSize: 11, marginBottom: 4 }}>
                    {f.label}
                  </div>
                  <div style={{ fontSize: 14, color: "var(--text-dim)" }}>{f.value}</div>
                </div>
              ))}
            </div>

            <div>
              <div className="mono mute" style={{ fontSize: 11, marginBottom: 4 }}>
                DESCRIPCIÓN
              </div>
              <div style={{ fontSize: 14, color: "var(--text-dim)", lineHeight: 1.5 }}>
                {selected.storeDescription}
              </div>
            </div>

            {selected.status !== "PENDIENTE" && selected.reviewNote && (
              <div style={{ border: "1px solid var(--border)", padding: 12 }}>
                <div className="mono mute" style={{ fontSize: 11, marginBottom: 4 }}>
                  MOTIVO DE LA REVISIÓN
                </div>
                <div style={{ fontSize: 14, color: "var(--text-dim)" }}>{selected.reviewNote}</div>
              </div>
            )}

            {selected.status === "PENDIENTE" && (
              <>
                <div>
                  <div className="label">Motivo (requerido para rechazar)</div>
                  <textarea
                    className="input"
                    value={reviewNote}
                    onChange={(e) => setReviewNote(e.target.value)}
                    placeholder="Notas para el solicitante..."
                    style={{ minHeight: 70, resize: "vertical" }}
                    disabled={acting}
                  />
                </div>
                {actionError && (
                  <p style={{ fontSize: 12, color: "var(--danger)", fontFamily: "var(--font-mono)", margin: 0 }}>
                    {actionError}
                  </p>
                )}
                <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                  <button
                    className="btn btn-ghost"
                    style={{ padding: "10px 18px", fontSize: 12, color: "var(--danger)", borderColor: "var(--danger)" }}
                    onClick={() => handleReview("RECHAZADA")}
                    disabled={acting}
                  >
                    {acting ? "..." : "Rechazar"}
                  </button>
                  <button
                    className="btn"
                    style={{ padding: "10px 24px", fontSize: 12 }}
                    onClick={() => handleReview("APROBADA")}
                    disabled={acting}
                  >
                    {acting ? "..." : "Aprobar"}
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
