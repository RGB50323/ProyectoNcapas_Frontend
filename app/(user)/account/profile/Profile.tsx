"use client";

import { PageLoader } from "@/components/PageLoader";
import { useAuth, authFetch, getUserId } from "@/lib/auth";
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

export default function Profile() {
  const router = useRouter();
  const { session, loading } = useAuth();

  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submittingStore, setSubmittingStore] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [storeForm, setStoreForm] = useState({
    storeName: "",
    storeDescription: "",
  });

  const [form, setForm] = useState(() => ({
    firstName: session?.firstName ?? "",
    lastName: session?.lastName ?? "",
    email: session?.email ?? "",
    phone: (session as any)?.phone ?? "",
  }));

  const [sellerProfile, setSellerProfile] = useState<any>(null);
  const [editingStore, setEditingStore] = useState(false);
  const [savingStore, setSavingStore] = useState(false);
  const [storeEditForm, setStoreEditForm] = useState({
    storeName: "",
    storeDescription: "",
  });
  const [storeEditError, setStoreEditError] = useState<string | null>(null);

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
    if (!session || !isSeller) return;
    const userId = getUserId(session);
    authFetch("/seller_profiles/", session)
      .then((r) => r.json())
      .then((json) => {
        const profile = json?.data?.find((p: any) => p.user.uuid === userId);
        if (profile) {
          setSellerProfile(profile);
          setStoreEditForm({
            storeName: profile.storeName,
            storeDescription: profile.storeDescription,
          });
        }
      })
      .catch(() => {});
  }, [session]);

  if (loading) return <PageLoader />;
  if (!session) {
    router.replace("/login");
    return null;
  }

  const initials =
    `${session.firstName[0]}${session.lastName?.[0] ?? ""}`.toUpperCase();
  const isSeller = session.role === "SELLER";

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  function handleStoreChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) {
    setStoreForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  function handleCancel() {
    setForm({
      firstName: session!.firstName,
      lastName: session!.lastName ?? "",
      email: session!.email,
      phone: (session as any)?.phone ?? "",
    });
    setError(null);
    setEditing(false);
  }

  async function handleSave() {
    setError(null);
    setSaving(true);
    try {
      const payload = decodeJwtPayload(session!.accessToken);
      const userId = payload.userId as string;
      if (!userId)
        throw new Error("No se pudo obtener el ID de usuario del token.");

      const body = {
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        ...(form.phone.trim() ? { phone: form.phone.trim() } : {}),
      };

      const res = await authFetch(`/users/update/${userId}`, session!, {
        method: "PUT",
        body: JSON.stringify(body),
      });

      const json = await res.json().catch(() => null);
      if (!res.ok) {
        const msg = json?.message;
        if (typeof msg === "string") throw new Error(msg);
        if (msg && typeof msg === "object")
          throw new Error(Object.values(msg).join(". "));
        throw new Error(`Error ${res.status}`);
      }

      const updated = json?.data;
      if (updated?.accessToken) {
        const newSession = { ...session, ...updated };
        localStorage.setItem("klab_session", JSON.stringify(newSession));
        window.location.reload();
      }

      setEditing(false);
    } catch (err: any) {
      setError(err.message ?? "Error al guardar los cambios.");
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveStore() {
    setStoreEditError(null);
    setSavingStore(true);
    try {
      const res = await authFetch(
        `/seller_profiles/update/${sellerProfile.id}`,
        session!,
        {
          method: "PUT",
          body: JSON.stringify({
            storeName: storeEditForm.storeName.trim(),
            storeDescription: storeEditForm.storeDescription.trim(),
          }),
        },
      );

      const json = await res.json().catch(() => null);
      if (!res.ok) {
        const msg = json?.message;
        if (typeof msg === "string") throw new Error(msg);
        if (msg && typeof msg === "object")
          throw new Error(Object.values(msg).join(". "));
        throw new Error(`Error ${res.status}`);
      }

      setSellerProfile(json?.data);
      setEditingStore(false);
    } catch (err: any) {
      setStoreEditError(err.message ?? "Error al guardar los cambios.");
    } finally {
      setSavingStore(false);
    }
  }

  async function handleRegisterStore(e: React.FormEvent) {
    e.preventDefault();
    setModalError(null);

    if (!storeForm.storeName.trim()) {
      setModalError("El nombre de la tienda es requerido");
      return;
    }
    if (!storeForm.storeDescription.trim()) {
      setModalError("La descripción de la tienda es requerido");
      return;
    }

    setSubmittingStore(true);
    try {
      const payload = decodeJwtPayload(session!.accessToken);
      const userId = payload.userId as string;
      if (!userId) throw new Error("User ID can not be empty");

      const body = {
        storeName: storeForm.storeName.trim(),
        storeDescription: storeForm.storeDescription.trim(),
        userId: userId,
      };

      const res = await authFetch("/seller_profiles/create", session!, {
        method: "POST",
        body: JSON.stringify(body),
      });

      const json = await res.json().catch(() => null);
      if (!res.ok) {
        const msg = json?.message;
        if (typeof msg === "string") throw new Error(msg);
        if (msg && typeof msg === "object")
          throw new Error(Object.values(msg).join(". "));
        throw new Error(`Error ${res.status}`);
      }

      const updated = json?.data;
      if (updated?.accessToken) {
        const newSession = { ...session, ...updated };
        localStorage.setItem("klab_session", JSON.stringify(newSession));
        setIsModalOpen(false);
        window.location.reload();
      }
    } catch (err: any) {
      setModalError(err.message ?? "Error al registrar la tienda.");
    } finally {
      setSubmittingStore(false);
    }
  }

  const displayName = editing
    ? `${form.firstName} ${form.lastName}`.toUpperCase()
    : `${session.firstName.toUpperCase()} ${session.lastName?.toUpperCase() ?? ""}`;

  return (
    <div className="container" style={{ paddingBlock: 48 }}>
      <div className="mono mute" style={{ marginBottom: 32, fontSize: 12 }}>
        Cuenta / Perfil
      </div>

      <div
        className="card"
        style={{
          padding: 0,
          marginBottom: 24,
          overflow: "hidden",
          borderBottom: "1px solid var(--border)",
        }}
      >
        <div
          style={{
            height: 3,
            background:
              "linear-gradient(90deg, var(--accent-2) 0%, var(--border-bright) 100%)",
          }}
        />
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
              <h1
                className="display"
                style={{ fontSize: 48, lineHeight: 0.92, marginBottom: 12 }}
              >
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

          <div style={{ display: "flex", gap: 10, flexShrink: 0 }}>
            <button className="btn" onClick={() => router.push("/account")}>
              ← Cuenta
            </button>
          </div>
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          marginBottom: 24,
          border: "1px solid var(--border)",
          background: "var(--card)",
        }}
      >
        {[
          { label: "PEDIDOS", value: "14" },
          { label: "DROPS PRIVADOS", value: "8" },
          { label: "PRÓXIMO PEDIDO", value: "02 JUN" },
        ].map((s, i, arr) => (
          <div
            key={s.label}
            style={{
              padding: "20px 24px",
              borderRight:
                i < arr.length - 1 ? "1px solid var(--border)" : "none",
            }}
          >
            <div
              className="mono mute"
              style={{ fontSize: 11, marginBottom: 8 }}
            >
              {s.label}
            </div>
            <div
              className="display"
              style={{ fontSize: 28, color: "var(--text)" }}
            >
              {s.value}
            </div>
          </div>
        ))}
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
          gap: 16,
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
                onClick={() => setEditing(true)}
              >
                Editar
              </button>
            )}
          </div>

          {editing ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "16px 24px",
                }}
              >
                {(
                  [
                    { label: "NOMBRE", name: "firstName", type: "text" },
                    { label: "APELLIDO", name: "lastName", type: "text" },
                    {
                      label: "CORREO ELECTRÓNICO",
                      name: "email",
                      type: "email",
                    },
                    { label: "TELÉFONO", name: "phone", type: "tel" },
                  ] as const
                ).map((f) => (
                  <div key={f.name}>
                    <div
                      className="mono mute"
                      style={{ fontSize: 11, marginBottom: 6 }}
                    >
                      {f.label}
                    </div>
                    <input
                      className="input"
                      type={f.type}
                      name={f.name}
                      value={form[f.name]}
                      onChange={handleChange}
                      placeholder={f.label}
                      disabled={saving}
                    />
                  </div>
                ))}
              </div>

              {error && (
                <p
                  style={{
                    fontSize: 12,
                    color: "var(--err, #e05252)",
                    fontFamily: "var(--font-mono)",
                    margin: 0,
                  }}
                >
                  {error}
                </p>
              )}

              <div
                style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}
              >
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
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "20px 32px",
              }}
            >
              {[
                { label: "NOMBRE", value: session.firstName },
                { label: "APELLIDO", value: session.lastName },
                { label: "CORREO ELECTRÓNICO", value: session.email },
                {
                  label: "TELÉFONO",
                  value: (session as any).phone || (
                    <span
                      style={{ color: "var(--text-mute)", fontStyle: "italic" }}
                    >
                      No registrado
                    </span>
                  ),
                },
                { label: "ROL", value: session.role },
                { label: "MIEMBRO DESDE", value: "2024" },
              ].map((f) => (
                <div key={f.label}>
                  <div
                    className="mono mute"
                    style={{ fontSize: 11, marginBottom: 6 }}
                  >
                    {f.label}
                  </div>
                  <div style={{ fontSize: 14, color: "var(--text-dim)" }}>
                    {f.value}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
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
                  fontSize: 10,
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
              Actualiza tus credenciales periódicamente para mantener la cuenta
              protegida.
            </p>

            <div style={{ display: "flex", gap: 10 }}>
              <button
                className="btn"
                style={{ flex: 1 }}
                onClick={() => router.push("/account/security")}
              >
                Actualizar contraseña
              </button>
            </div>
          </div>

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
                {isSeller ? "MI TIENDA" : "CONVERTIRSE EN VENDEDOR"}
              </h2>
              <span
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 10,
                  letterSpacing: "0.12em",
                  color: isSeller ? "var(--ok)" : "var(--text-mute)",
                  border: isSeller
                    ? "1px solid var(--ok)"
                    : "1px solid var(--border)",
                  padding: "2px 8px",
                }}
              >
                {isSeller ? "● SELLER" : "○ BUYER"}
              </span>
            </div>

            {isSeller ? (
              <div>
                {sellerProfile ? (
                  <>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                      {!editingStore && (
                        <button
                          className="btn btn-ghost"
                          style={{ padding: "8px 14px", fontSize: 11, marginLeft: "auto" }}
                          onClick={() => setEditingStore(true)}
                        >
                          Editar
                        </button>
                      )}
                    </div>
                    {editingStore ? (
                      <div style={{ display: "flex", flexDirection: "column", gap: 16, marginBottom: 20 }}>
                        {([
                          { label: "NOMBRE DE TIENDA", name: "storeName" },
                          { label: "DESCRIPCIÓN", name: "storeDescription" },
                        ] as const).map((f) => (
                          <div key={f.name}>
                            <div className="mono mute" style={{ fontSize: 11, marginBottom: 6 }}>{f.label}</div>
                            <input
                              className="input"
                              type="text"
                              name={f.name}
                              value={storeEditForm[f.name]}
                              onChange={(e) => setStoreEditForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))}
                              disabled={savingStore}
                            />
                          </div>
                        ))}
                        {storeEditError && (
                          <p style={{ fontSize: 12, color: "var(--err, #e05252)", fontFamily: "var(--font-mono)", margin: 0 }}>
                            {storeEditError}
                          </p>
                        )}
                        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                          <button
                            className="btn btn-ghost"
                            style={{ padding: "8px 14px", fontSize: 11 }}
                            onClick={() => {
                              setStoreEditForm({ storeName: sellerProfile.storeName, storeDescription: sellerProfile.storeDescription });
                              setStoreEditError(null);
                              setEditingStore(false);
                            }}
                            disabled={savingStore}
                          >
                            Cancelar
                          </button>
                          <button
                            className="btn"
                            style={{ padding: "8px 20px", fontSize: 11 }}
                            onClick={handleSaveStore}
                            disabled={savingStore}
                          >
                            {savingStore ? "Guardando..." : "Guardar cambios"}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px 24px", marginBottom: 20 }}>
                        {[
                          { label: "TIENDA", value: sellerProfile.storeName },
                          { label: "VENTAS TOTALES", value: sellerProfile.totalSales },
                          { label: "VERIFICADO", value: sellerProfile.verified ? "Sí" : "No" },
                          { label: "DESCRIPCIÓN", value: sellerProfile.storeDescription },
                        ].map((f) => (
                          <div key={f.label}>
                            <div className="mono mute" style={{ fontSize: 11, marginBottom: 6 }}>{f.label}</div>
                            <div style={{ fontSize: 14, color: "var(--text-dim)" }}>{f.value}</div>
                          </div>
                        ))}
                      </div>
                    )}
                    <button
                      className="btn"
                      style={{ width: "100%", background: "transparent", border: "1px solid var(--border-bright)", color: "var(--text)" }}
                      onClick={() => router.push("/seller/dashboard")}
                    >
                      Ir al Panel de Tienda →
                    </button>
                  </>
                ) : (
                  <p className="mute" style={{ fontSize: 13, marginBottom: 20 }}>
                    Cargando información de tienda...
                  </p>
                )}
              </div>
            ) : (
              <div>
                <p className="mute" style={{ fontSize: 13, marginBottom: 20 }}>
                  Abre tu propio espacio comercial en nuestra plataforma,
                  publica inventario propio y expande tus utilidades.
                </p>
                <button
                  className="btn"
                  style={{ width: "100%" }}
                  onClick={() => setIsModalOpen(true)}
                >
                  Registrar mi tienda
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {isModalOpen && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            background: "rgba(0, 0, 0, 0.75)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
        >
          <div
            className="card"
            style={{
              width: "100%",
              maxWidth: 480,
              padding: 32,
              background: "var(--elev, #121212)",
              border: "1px solid var(--border-bright)",
            }}
          >
            <h3 className="display" style={{ fontSize: 24, marginBottom: 6 }}>
              NUEVO PERFIL COMERCIAL
            </h3>
            <p className="mono mute" style={{ fontSize: 11, marginBottom: 24 }}>
              ESTABLECER PARÁMETROS DE TIENDA
            </p>

            <form
              onSubmit={handleRegisterStore}
              style={{ display: "flex", flexDirection: "column", gap: 20 }}
            >
              <div>
                <label
                  className="mono mute"
                  style={{ fontSize: 11, display: "block", marginBottom: 6 }}
                >
                  NOMBRE DE LA TIENDA
                </label>
                <input
                  className="input"
                  type="text"
                  name="storeName"
                  value={storeForm.storeName}
                  onChange={handleStoreChange}
                  placeholder="Ej. Mr. K"
                  disabled={submittingStore}
                  required
                />
              </div>

              <div>
                <label
                  className="mono mute"
                  style={{ fontSize: 11, display: "block", marginBottom: 6 }}
                >
                  DESCRIPCIÓN DE LA TIENDA
                </label>
                <textarea
                  className="input"
                  name="storeDescription"
                  value={storeForm.storeDescription}
                  onChange={handleStoreChange}
                  placeholder="Descripción detallada de la tienda..."
                  disabled={submittingStore}
                  required
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

              {modalError && (
                <p
                  style={{
                    fontSize: 12,
                    color: "var(--err, #e05252)",
                    fontFamily: "var(--font-mono)",
                    margin: 0,
                  }}
                >
                  {modalError}
                </p>
              )}

              <div
                style={{
                  display: "flex",
                  gap: 12,
                  justifyContent: "flex-end",
                  marginTop: 8,
                }}
              >
                <button
                  type="button"
                  className="btn btn-ghost"
                  style={{ padding: "10px 16px", fontSize: 12 }}
                  onClick={() => {
                    setIsModalOpen(false);
                    setStoreForm({ storeName: "", storeDescription: "" });
                    setModalError(null);
                  }}
                  disabled={submittingStore}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn"
                  style={{ padding: "10px 24px", fontSize: 12 }}
                  disabled={submittingStore}
                >
                  {submittingStore ? "Registrando..." : "Confirmar Registro"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}