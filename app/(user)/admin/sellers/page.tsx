"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth, authFetch } from "@/lib/auth";
import { PageLoader } from "@/components/PageLoader";
import Modal from "@/components/Modal";

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
  const [fetching, setFetching] = useState(true);
  const [deleteModal, setDeleteModal] = useState(false);
  const [selected, setSelected] = useState<SellerProfile | null>(null);
  const [acting, setActing] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

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
      <div style={{ marginBottom: 24 }}>
        <div className="eyebrow" style={{ color: "var(--accent-2)" }}>
          ◆ GESTIÓN DE PERSONAS
        </div>
        <h1 className="display" style={{ fontSize: 40, marginTop: 8 }}>
          VENDEDORES
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
            {sellers.map((s) => (
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
                <td>
                  <button
                    className="mono"
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      fontSize: 11,
                      color: "var(--err, #e05252)",
                    }}
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
      
      {sellers.length === 0 && (
        <div className="card" style={{ padding: 28, textAlign: "center", marginTop: 15 }}>
          <p className="mono mute" style={{ fontSize: 13 }}>
            No hay vendedores registrados.
          </p>
        </div>
      )}


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
