"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth, authFetch } from "@/lib/auth";
import { PageLoader } from "@/components/PageLoader";
import Modal from "@/components/Modal";
import { useToast } from "@/hooks/useToast";
import { usePaged } from "@/hooks/usePaged";
import Pagination from "@/components/Pagination";

type Address = {
  id: string;
  street: string;
  city: string;
  state: string;
  country: string;
  zipCode: string;
  user: {
    uuid: string;
    firstName: string;
    lastName: string;
    email: string;
  };
};

export default function AdminAddressesPage() {
  const { session, loading } = useAuth();
  const router = useRouter();

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [fetching, setFetching] = useState(true);
  const [deleteModal, setDeleteModal] = useState(false);
  const [deleteAllModal, setDeleteAllModal] = useState(false);
  const [selected, setSelected] = useState<Address | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedUserName, setSelectedUserName] = useState<string>("");
  const [acting, setActing] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const { show, ToastContainer } = useToast();

  const groups = useMemo(
    () =>
      Object.values(
        addresses.reduce(
          (acc, a) => {
            if (!acc[a.user.uuid]) acc[a.user.uuid] = { user: a.user, items: [] };
            acc[a.user.uuid].items.push(a);
            return acc;
          },
          {} as Record<string, { user: Address["user"]; items: Address[] }>,
        ),
      ),
    [addresses],
  );
  const { page, setPage, pageItems, pageCount } = usePaged(groups, 10, groups.length);

  useEffect(() => {
    if (!loading && !session) router.replace("/login");
    if (!loading && session?.role !== "ADMIN") router.replace("/");
  }, [loading, session]);

  useEffect(() => {
    if (!session) return;
    authFetch("/addresses/", session)
      .then((r) => r.json())
      .then((json) => setAddresses(json?.data ?? []))
      .catch(() => {})
      .finally(() => setFetching(false));
  }, [session]);

  if (loading || fetching) return <PageLoader />;
  if (!session) return null;

  async function handleDeleteOne() {
    if (!selected) return;
    setActionError(null);
    setActing(true);
    try {
      const res = await authFetch(`/addresses/${selected.id}`, session!, {
        method: "DELETE",
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) {
        const msg = json?.message;
        if (typeof msg === "string") throw new Error(msg);
        throw new Error(`Error ${res.status}`);
      }
      setAddresses((prev) => prev.filter((a) => a.id !== selected.id));
      setDeleteModal(false);
      show("Dirección eliminada éxitosamente", "success");
    } catch (err: any) {
      setActionError(err.message ?? "Error al eliminar la dirección.");
    } finally {
      setActing(false);
    }
  }

  async function handleDeleteAllByUser() {
    if (!selectedUserId) return;
    setActionError(null);
    setActing(true);
    try {
      const res = await authFetch(
        `/addresses/user/${selectedUserId}`,
        session!,
        { method: "DELETE" },
      );
      const json = await res.json().catch(() => null);
      if (!res.ok) {
        const msg = json?.message;
        if (typeof msg === "string") throw new Error(msg);
        throw new Error(`Error ${res.status}`);
      }
      setAddresses((prev) =>
        prev.filter((a) => a.user.uuid !== selectedUserId),
      );
      setDeleteAllModal(false);
      show(
        "Direcciones asociadas al usuario eliminadas éxitosamente",
        "success",
      );
    } catch (err: any) {
      setActionError(err.message ?? "Error al eliminar las direcciones.");
    } finally {
      setActing(false);
    }
  }

  return (
    <div>
      <ToastContainer />
      <div style={{ marginBottom: 24 }}>
        <div className="eyebrow" style={{ color: "var(--accent-2)" }}>
          ◆ GESTIÓN DE DATOS
        </div>
        <h1 className="display" style={{ fontSize: 'clamp(28px, 7vw, 40px)', marginTop: 8 }}>
          DIRECCIONES
        </h1>
      </div>

      {pageItems.map(({ user, items }) => (
        <div
          key={user.uuid}
          className="card"
          style={{ padding: 0, marginBottom: 16 }}
        >
          <div
            style={{
              padding: "14px 20px",
              borderBottom: "1px solid var(--border)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 10,
              background: "var(--elev)",
            }}
          >
            <div>
              <div style={{ fontFamily: "var(--font-display)", fontSize: 14 }}>
                {user.firstName} {user.lastName}
              </div>
              <div className="mono mute" style={{ fontSize: 11, marginTop: 2 }}>
                {user.email}
              </div>
            </div>
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
                setSelectedUserId(user.uuid);
                setSelectedUserName(`${user.firstName} ${user.lastName}`);
                setActionError(null);
                setDeleteAllModal(true);
              }}
            >
              ELIMINAR TODAS
            </button>
          </div>
          <div style={{ overflowX: "auto" }}>
          <table className="table">
            <thead>
              <tr>
                <th>Dirección</th>
                <th>Ciudad</th>
                <th>País</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {items.map((a) => (
                <tr key={a.id}>
                  <td className="mono mute">{a.street}</td>
                  <td className="mono mute">
                    {a.city}, {a.state}
                  </td>
                  <td className="mono mute">
                    {a.country} {a.zipCode}
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
                        setSelected(a);
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
        </div>
      ))}

      <Pagination page={page} pageCount={pageCount} onPage={setPage} />

      {addresses.length === 0 && (
        <div className="card" style={{ padding: 28, textAlign: "center" }}>
          <p className="mono mute" style={{ fontSize: 13 }}>
            No hay direcciones registradas.
          </p>
        </div>
      )}

      <Modal
        open={deleteModal}
        title="ELIMINAR DIRECCIÓN"
        onClose={() => {
          setDeleteModal(false);
          setActionError(null);
        }}
        width={400}
      >
        <p className="mute" style={{ fontSize: 13, marginBottom: 20 }}>
          ¿Eliminar la dirección{" "}
          <strong style={{ color: "var(--text)" }}>
            {selected?.street}, {selected?.city}
          </strong>
          ?
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
            onClick={handleDeleteOne}
            disabled={acting}
          >
            {acting ? "Eliminando..." : "Confirmar"}
          </button>
        </div>
      </Modal>

      <Modal
        open={deleteAllModal}
        title="ELIMINAR TODAS LAS DIRECCIONES"
        onClose={() => {
          setDeleteAllModal(false);
          setActionError(null);
        }}
        width={440}
      >
        <p className="mute" style={{ fontSize: 13, marginBottom: 20 }}>
          ¿Eliminar todas las direcciones de{" "}
          <strong style={{ color: "var(--text)" }}>{selectedUserName}</strong>?
          Esta acción no se puede deshacer.
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
              setDeleteAllModal(false);
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
            onClick={handleDeleteAllByUser}
            disabled={acting}
          >
            {acting ? "Eliminando..." : "Confirmar"}
          </button>
        </div>
      </Modal>
    </div>
  );
}
