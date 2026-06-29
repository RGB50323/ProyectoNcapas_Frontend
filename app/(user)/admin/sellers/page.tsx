"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth, authFetch } from "@/lib/auth";
import { PageLoader } from "@/components/PageLoader";
import Modal from "@/components/Modal";
import { useToast } from "@/hooks/useToast";
import { usePaged } from "@/hooks/usePaged";
import Pagination from "@/components/Pagination";

type SellerProfile = {
  id: string;
  storeName: string;
  storeDescription: string;
  rating: number | null;
  totalSales: number;
  verified: boolean;
  user: {
    uuid: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string | null;
    role: string;
  };
};

export default function AdminSellersPage() {
  const { session, loading } = useAuth();
  const router = useRouter();

  const [sellers, setSellers] = useState<SellerProfile[]>([]);
  const { page, setPage, pageItems, pageCount } = usePaged(sellers, 10, sellers.length);
  const [fetching, setFetching] = useState(true);
  const [deleteModal, setDeleteModal] = useState(false);
  const [editModal, setEditModal] = useState(false);
  const [verifyModal, setVerifyModal] = useState(false);
  const [editForm, setEditForm] = useState({ storeName: "", storeDescription: "" });
  const [selected, setSelected] = useState<SellerProfile | null>(null);
  const [acting, setActing] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const { show, ToastContainer } = useToast();

  useEffect(() => {
    if (!loading && !session) router.replace("/login");
    if (!loading && session?.role !== "ADMIN") router.replace("/");
  }, [loading, session]);

  useEffect(() => {
    if (!session) return;
    authFetch("/seller_profiles/", session)
      .then((r) => r.json())
      .then((json) => setSellers(json?.data ?? []))
      .catch(() => {})
      .finally(() => setFetching(false));
  }, [session]);

  if (loading || fetching) return <PageLoader />;
  if (!session) return null;

  async function handleVerify() {
    if (!selected) return;
    setActionError(null);
    setActing(true);
    try {
      const res = await authFetch(`/seller_profiles/${selected.id}/verify`, session!, {
        method: "PATCH",
        body: JSON.stringify({ verified: !selected.verified }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) {
        const msg = json?.message;
        if (typeof msg === "string") throw new Error(msg);
        throw new Error(`Error ${res.status}`);
      }
      const newVerified = !selected.verified;
      setSellers((prev) => prev.map((s) => (s.id === selected.id ? { ...s, verified: newVerified } : s)));
      setVerifyModal(false);
      show(newVerified ? "Tienda verificada" : "Verificación retirada", "success");
    } catch (err: any) {
      setActionError(err.message ?? "Error al actualizar la verificación.");
    } finally {
      setActing(false);
    }
  }

  async function handleEdit() {
    if (!selected) return;
    setActionError(null);
    setActing(true);
    try {
      const res = await authFetch(`/seller_profiles/update/${selected.id}`, session!, {
        method: "PUT",
        body: JSON.stringify({
          storeName: editForm.storeName.trim(),
          storeDescription: editForm.storeDescription.trim(),
        }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) {
        const msg = json?.message;
        if (typeof msg === "string") throw new Error(msg);
        throw new Error(`Error ${res.status}`);
      }
      setSellers((prev) => prev.map((s) => (s.id === selected.id ? { ...s, ...json?.data } : s)));
      setEditModal(false);
      show("Tienda actualizada", "success");
    } catch (err: any) {
      setActionError(err.message ?? "Error al actualizar la tienda.");
    } finally {
      setActing(false);
    }
  }

  async function handleDelete() {
    if (!selected) return;
    setActionError(null);
    setActing(true);
    try {
      const res = await authFetch(`/seller_profiles/${selected.id}`, session!, {
        method: "DELETE",
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) {
        const msg = json?.message;
        if (typeof msg === "string") throw new Error(msg);
        throw new Error(`Error ${res.status}`);
      }
      setSellers((prev) => prev.filter((s) => s.id !== selected.id));
      setDeleteModal(false);
    } catch (err: any) {
      setActionError(err.message ?? "Error al eliminar el perfil.");
    } finally {
      setActing(false);
    }
  }

  return (
    <div>
      <ToastContainer />
      <div style={{ marginBottom: 24 }}>
        <div className="eyebrow" style={{ color: "var(--accent-2)" }}>
          ◆ GESTIÓN DE PERSONAS
        </div>
        <h1 className="display" style={{ fontSize: 'clamp(28px, 7vw, 40px)', marginTop: 8 }}>
          TIENDAS
        </h1>
      </div>

      <div className="card" style={{ padding: 0 }}>
        <div
          style={{
            padding: "16px 20px",
            borderBottom: "1px solid var(--border)",
          }}
        >
          <div className="mono mute" style={{ fontSize: 11 }}>
            {sellers.length} PERFILES
          </div>
        </div>
        <div style={{ overflowX: "auto" }}>
        <table className="table">
          <thead>
            <tr>
              <th>Tienda</th>
              <th>Vendedor</th>
              <th>Email</th>
              <th>Ventas</th>
              <th>Verificado</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {pageItems.map((s) => (
              <tr key={s.id}>
                <td>
                  <div
                    style={{ fontFamily: "var(--font-display)", fontSize: 13 }}
                  >
                    {s.storeName}
                  </div>
                  <div
                    className="mono mute"
                    style={{ fontSize: 11, marginTop: 2 }}
                  >
                    {s.storeDescription}
                  </div>
                </td>
                <td>
                  {s.user.firstName} {s.user.lastName}
                </td>
                <td className="mono mute">{s.user.email}</td>
                <td className="display" style={{ fontSize: 14 }}>
                  {s.totalSales}
                </td>
                <td>
                  <span className={`pill ${s.verified ? "green" : "gray"}`}>
                    {s.verified ? "SÍ" : "NO"}
                  </span>
                </td>
                <td style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                  <button
                    className="mono"
                    style={{ background: "none", border: "none", cursor: "pointer", fontSize: 11, color: s.verified ? "var(--text-mute)" : "var(--ok)" }}
                    onClick={() => {
                      setSelected(s);
                      setActionError(null);
                      setVerifyModal(true);
                    }}
                  >
                    {s.verified ? "QUITAR VERIF." : "VERIFICAR"}
                  </button>
                  <Link className="mono mute" style={{ fontSize: 11, marginLeft: 16 }} href={`/admin/products?seller=${s.id}`}>
                    PRODUCTOS
                  </Link>
                  <button
                    className="mono accent"
                    style={{ background: "none", border: "none", cursor: "pointer", fontSize: 11, marginLeft: 16 }}
                    onClick={() => {
                      setSelected(s);
                      setEditForm({ storeName: s.storeName, storeDescription: s.storeDescription });
                      setActionError(null);
                      setEditModal(true);
                    }}
                  >
                    EDITAR
                  </button>
                  <button
                    className="mono"
                    style={{ background: "none", border: "none", cursor: "pointer", fontSize: 11, color: "var(--danger)", marginLeft: 16 }}
                    onClick={() => {
                      setSelected(s);
                      setActionError(null);
                      setDeleteModal(true);
                    }}
                  >
                    ELIMINAR
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
        <Pagination page={page} pageCount={pageCount} onPage={setPage} />
      </div>

      {sellers.length === 0 && (
        <div className="card" style={{ padding: 28, textAlign: "center", marginTop: 15 }}>
          <p className="mono mute" style={{ fontSize: 13 }}>
            No hay vendedores registrados.
          </p>
        </div>
      )}


      <Modal
        open={verifyModal}
        title={selected?.verified ? "QUITAR VERIFICACIÓN" : "VERIFICAR TIENDA"}
        onClose={() => { setVerifyModal(false); setActionError(null); }}
        width={440}
      >
        <p className="mute" style={{ fontSize: 15, lineHeight: 1.6, marginBottom: 24 }}>
          {selected?.verified ? (
            <>¿Quitar la verificación de <strong style={{ color: "var(--text)" }}>{selected?.storeName}</strong>?</>
          ) : (
            <>¿Marcar <strong style={{ color: "var(--text)" }}>{selected?.storeName}</strong> como tienda verificada?</>
          )}
        </p>
        {actionError && (
          <p style={{ fontSize: 12, color: "var(--danger)", fontFamily: "var(--font-mono)", marginBottom: 12 }}>{actionError}</p>
        )}
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button className="btn btn-ghost" style={{ padding: "10px 16px", fontSize: 12 }} onClick={() => { setVerifyModal(false); setActionError(null); }} disabled={acting}>Cancelar</button>
          <button className="btn" style={{ padding: "10px 24px", fontSize: 12 }} onClick={handleVerify} disabled={acting}>{acting ? "Guardando..." : "Confirmar"}</button>
        </div>
      </Modal>

      <Modal
        open={editModal}
        title="EDITAR TIENDA"
        onClose={() => { setEditModal(false); setActionError(null); }}
        width={480}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <div className="label">Nombre de tienda</div>
            <input className="input" value={editForm.storeName} onChange={(e) => setEditForm((f) => ({ ...f, storeName: e.target.value }))} />
          </div>
          <div>
            <div className="label">Descripción</div>
            <textarea className="input" value={editForm.storeDescription} onChange={(e) => setEditForm((f) => ({ ...f, storeDescription: e.target.value }))} style={{ minHeight: 80, resize: "vertical" }} />
          </div>
          {actionError && <p style={{ fontSize: 12, color: "var(--danger)", fontFamily: "var(--font-mono)", margin: 0 }}>{actionError}</p>}
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <button className="btn btn-ghost" style={{ padding: "10px 16px", fontSize: 12 }} onClick={() => { setEditModal(false); setActionError(null); }} disabled={acting}>Cancelar</button>
            <button className="btn" style={{ padding: "10px 24px", fontSize: 12 }} onClick={handleEdit} disabled={acting}>{acting ? "Guardando..." : "Guardar"}</button>
          </div>
        </div>
      </Modal>

      <Modal
        open={deleteModal}
        title="ELIMINAR PERFIL DE TIENDA"
        onClose={() => {
          setDeleteModal(false);
          setActionError(null);
        }}
        width={440}
      >
        <p className="mute" style={{ fontSize: 13, marginBottom: 20 }}>
          ¿Eliminar la tienda{" "}
          <strong style={{ color: "var(--text)" }}>
            {selected?.storeName}
          </strong>{" "}
          de {selected?.user.firstName} {selected?.user.lastName}? El usuario
          volverá a ser BUYER.
        </p>
        {actionError && (
          <p
            style={{
              fontSize: 12,
              color: "var(--err, #e05252)",
              fontFamily: "var(--font-mono)",
              marginBottom: 12,
            }}
          >
            {actionError}
          </p>
        )}
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button
            className="btn btn-ghost"
            style={{ padding: "10px 16px", fontSize: 12 }}
            onClick={() => {
              setDeleteModal(false);
              setActionError(null);
            }}
            disabled={acting}
          >
            Cancelar
          </button>
          <button
            className="btn"
            style={{
              padding: "10px 24px",
              fontSize: 12,
              background: "var(--err, #e05252)",
              borderColor: "var(--err, #e05252)",
            }}
            onClick={handleDelete}
            disabled={acting}
          >
            {acting ? "Eliminando..." : "Confirmar"}
          </button>
        </div>
      </Modal>
    </div>
  );
}
