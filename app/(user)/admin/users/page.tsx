"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth, authFetch } from "@/lib/auth";
import { PageLoader } from "@/components/PageLoader";
import Modal from "@/components/Modal";
import { useToast } from "@/hooks/useToast";

type User = {
  uuid: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  role: string;
};

export default function AdminUsersPage() {
  const { session, loading } = useAuth();
  const router = useRouter();

  const [users, setUsers] = useState<User[]>([]);
  const [fetching, setFetching] = useState(true);

  const [roleModal, setRoleModal] = useState(false);
  const [deleteModal, setDeleteModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [newRole, setNewRole] = useState("");
  const [acting, setActing] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const { show, ToastContainer } = useToast();

  useEffect(() => {
    if (!loading && !session) router.replace("/login");
    if (!loading && session?.role !== "ADMIN") router.replace("/");
  }, [loading, session]);

  useEffect(() => {
    if (!session) return;
    authFetch("/users/", session)
      .then((r) => r.json())
      .then((json) => setUsers((json?.data ?? []).filter((u: User) => u.role !== "ADMIN")))
      .catch(() => {})
      .finally(() => setFetching(false));
  }, [session]);

  if (loading || fetching) return <PageLoader />;
  if (!session) return null;

  async function handleChangeRole() {
    if (!selectedUser || !newRole) return;
    setActionError(null);
    setActing(true);
    try {
      const res = await authFetch(
        `/users/${selectedUser.uuid}/role`,
        session!,
        {
          method: "PATCH",
          body: JSON.stringify({ role: newRole }),
        },
      );
      const json = await res.json().catch(() => null);
      if (!res.ok) {
        const msg = json?.message;
        if (typeof msg === "string") throw new Error(msg);
        throw new Error(`Error ${res.status}`);
      }
      setUsers((prev) =>
        prev.map((u) =>
          u.uuid === selectedUser.uuid ? { ...u, role: newRole } : u,
        ),
      );
      setRoleModal(false);
      show("Rol actualizado correctamente", "success");
    } catch (err: any) {
      setActionError(err.message ?? "Error al cambiar el rol.");
    } finally {
      setActing(false);
    }
  }

  async function handleDeleteUser() {
    if (!selectedUser) return;
    setActionError(null);
    setActing(true);
    try {
      const res = await authFetch(`/users/${selectedUser.uuid}`, session!, {
        method: "DELETE",
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) {
        const msg = json?.message;
        if (typeof msg === "string") throw new Error(msg);
        throw new Error(`Error ${res.status}`);
      }
      setUsers((prev) => prev.filter((u) => u.uuid !== selectedUser.uuid));
      setDeleteModal(false);
      show("Usuario eliminado correctamente", "success");
    } catch (err: any) {
      const msg = err.message ?? "";
      if (
        msg.toLowerCase().includes("integrity") ||
        msg.toLowerCase().includes("constraint")
      ) {
        setActionError(
          "No se puede eliminar este usuario porque tiene datos asociados (direcciones, tienda, etc). Elimínalos primero.",
        );
      } else {
        setActionError(msg || "Error al eliminar el usuario.");
      }
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
        <h1 className="display" style={{ fontSize: 40, marginTop: 8 }}>
          CLIENTES
        </h1>
      </div>

      <div className="card" style={{ padding: 0 }}>
        <div
          style={{
            padding: "16px 20px",
            borderBottom: "1px solid var(--border)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div className="mono mute" style={{ fontSize: 11 }}>
            {users.length} USUARIOS
          </div>
        </div>
        <table className="table">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Email</th>
              <th>Teléfono</th>
              <th>Rol</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.uuid}>
                <td>
                  <div
                    style={{ fontFamily: "var(--font-display)", fontSize: 13 }}
                  >
                    {u.firstName} {u.lastName}
                  </div>
                </td>
                <td className="mono mute">{u.email}</td>
                <td className="mono mute">{u.phone ?? "—"}</td>
                <td>
                  <span
                    className={`pill ${u.role === "ADMIN" ? "green" : u.role === "SELLER" ? "yellow" : "gray"}`}
                  >
                    {u.role}
                  </span>
                </td>
                <td>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button
                      className="mono accent"
                      style={{
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        fontSize: 11,
                      }}
                      onClick={() => {
                        setSelectedUser(u);
                        setNewRole(u.role);
                        setActionError(null);
                        setRoleModal(true);
                      }}
                    >
                      ROL
                    </button>
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
                        setSelectedUser(u);
                        setActionError(null);
                        setDeleteModal(true);
                      }}
                    >
                      ELIMINAR
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal
        open={roleModal}
        title="CAMBIAR ROL"
        onClose={() => {
          setRoleModal(false);
          setActionError(null);
        }}
        width={400}
      >
        <p className="mute" style={{ fontSize: 13, marginBottom: 16 }}>
          Cambiando rol de{" "}
          <strong style={{ color: "var(--text)" }}>
            {selectedUser?.firstName} {selectedUser?.lastName}
          </strong>
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {["BUYER", "SELLER", "ADMIN"].map((role) => (
            <button
              key={role}
              onClick={() => setNewRole(role)}
              style={{
                padding: "10px 14px",
                border: `1px solid ${newRole === role ? "var(--accent)" : "var(--border)"}`,
                background: newRole === role ? "var(--elev)" : "transparent",
                color: newRole === role ? "var(--text)" : "var(--text-mute)",
                cursor: "pointer",
                fontFamily: "var(--font-mono)",
                fontSize: 12,
                letterSpacing: "0.1em",
                textAlign: "left",
              }}
            >
              {role}
            </button>
          ))}
        </div>
        {actionError && (
          <p
            style={{
              fontSize: 12,
              color: "var(--err, #e05252)",
              fontFamily: "var(--font-mono)",
              marginTop: 12,
            }}
          >
            {actionError}
          </p>
        )}
        <div
          style={{
            display: "flex",
            gap: 10,
            justifyContent: "flex-end",
            marginTop: 20,
          }}
        >
          <button
            className="btn btn-ghost"
            style={{ padding: "10px 16px", fontSize: 12 }}
            onClick={() => {
              setRoleModal(false);
              setActionError(null);
            }}
            disabled={acting}
          >
            Cancelar
          </button>
          <button
            className="btn"
            style={{ padding: "10px 24px", fontSize: 12 }}
            onClick={handleChangeRole}
            disabled={acting || newRole === selectedUser?.role}
          >
            {acting ? "Guardando..." : "Confirmar"}
          </button>
        </div>
      </Modal>

      <Modal
        open={deleteModal}
        title="ELIMINAR USUARIO"
        onClose={() => {
          setDeleteModal(false);
          setActionError(null);
        }}
        width={400}
      >
        <p className="mute" style={{ fontSize: 13, marginBottom: 20 }}>
          ¿Eliminar a{" "}
          <strong style={{ color: "var(--text)" }}>
            {selectedUser?.firstName} {selectedUser?.lastName}
          </strong>
          ? Esta acción no se puede deshacer.
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
            onClick={handleDeleteUser}
            disabled={acting}
          >
            {acting ? "Eliminando..." : "Confirmar"}
          </button>
        </div>
      </Modal>
    </div>
  );
}
