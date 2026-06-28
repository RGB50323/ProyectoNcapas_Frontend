"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth, authFetch } from "@/lib/auth";
import { PageLoader } from "@/components/PageLoader";
import Modal from "@/components/Modal";
import { Icon } from "@/components/Icon";
import { Select } from "@/components/Select";
import { useToast } from "@/hooks/useToast";
import { usePaged } from "@/hooks/usePaged";
import Pagination from "@/components/Pagination";

type User = {
  uuid: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  role: string;
  createdAt?: string;
};

export default function AdminUsersPage() {
  const { session, loading } = useAuth();
  const router = useRouter();

  const [users, setUsers] = useState<User[]>([]);
  const [fetching, setFetching] = useState(true);

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [sort, setSort] = useState("recent");

  const shown = useMemo(() => {
    const q = search.trim().toLowerCase();
    const name = (u: User) => `${u.firstName} ${u.lastName}`.toLowerCase();
    const time = (u: User) => (u.createdAt ? new Date(u.createdAt).getTime() : 0);
    return users
      .filter(
        (u) =>
          (!q || `${u.firstName} ${u.lastName} ${u.email}`.toLowerCase().includes(q)) &&
          (!roleFilter || u.role === roleFilter),
      )
      .sort((a, b) => {
        if (sort === "recent") return time(b) - time(a);
        if (sort === "oldest") return time(a) - time(b);
        if (sort === "az") return name(a).localeCompare(name(b));
        if (sort === "za") return name(b).localeCompare(name(a));
        return 0;
      });
  }, [users, search, roleFilter, sort]);

  const { page, setPage, pageItems, pageCount } = usePaged(shown, 10, `${search}|${roleFilter}|${sort}`);

  const [deleteModal, setDeleteModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
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
      .then((json) => setUsers(json?.data ?? []))
      .catch(() => {})
      .finally(() => setFetching(false));
  }, [session]);

  if (loading || fetching) return <PageLoader />;
  if (!session) return null;

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
          USUARIOS
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
            gap: 16,
            flexWrap: "wrap",
          }}
        >
          <div className="mono mute" style={{ fontSize: 11 }}>
            {shown.length} USUARIO{shown.length === 1 ? "" : "S"}
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            <input
              className="input"
              placeholder="Buscar nombre o email…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ width: 240, height: 38 }}
            />
            <Select
              value={roleFilter}
              onChange={setRoleFilter}
              width={150}
              placeholder="Todos los roles"
              ariaLabel="Filtrar por rol"
              options={[
                { value: "", label: "Todos los roles" },
                { value: "ADMIN", label: "ADMIN" },
                { value: "SELLER", label: "SELLER" },
                { value: "BUYER", label: "BUYER" },
              ]}
            />
            <Select
              value={sort}
              onChange={setSort}
              width={190}
              ariaLabel="Ordenar"
              options={[
                { value: "recent", label: "Más recientes" },
                { value: "oldest", label: "Más antiguos" },
                { value: "az", label: "Nombre · A–Z" },
                { value: "za", label: "Nombre · Z–A" },
              ]}
            />
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
            {pageItems.map((u) => (
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
                <td style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                  <button
                    className="icon-btn"
                    title="Ver detalle"
                    aria-label="Ver detalle"
                    style={{ verticalAlign: "middle" }}
                    onClick={() => router.push(`/admin/users/${u.uuid}`)}
                  >
                    <Icon.Eye />
                  </button>
                  <button
                    className="mono"
                    style={{ background: "none", border: "none", cursor: "pointer", fontSize: 11, color: "var(--danger)", marginLeft: 16, verticalAlign: "middle" }}
                    onClick={() => {
                      setSelectedUser(u);
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
        <Pagination page={page} pageCount={pageCount} onPage={setPage} />
      </div>

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
