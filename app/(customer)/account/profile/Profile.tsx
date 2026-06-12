"use client";

import { useAuth } from "@/lib/auth";
import { authFetch } from "@/lib/auth";
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
  const { session, logout } = useAuth();
  const router = useRouter();

  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState(() => ({
    firstName: session?.firstName ?? "",
    lastName: session?.lastName ?? "",
    email: session?.email ?? "",
    phone: (session as any)?.phone ?? "",
  }));

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

  if (!session) return null;

  const initials =
    `${session.firstName[0]}${session.lastName?.[0] ?? ""}`.toUpperCase();

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
              <div
                className="eyebrow"
                style={{ color: "var(--accent-2)", marginBottom: 8 }}
              >
                ◆ MIEMBRO K-SELECT · VAULT
              </div>
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
          { label: "PRÓXIMA INVITACIÓN", value: "02 JUN" },
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
        </div>
      </div>
    </div>
  );
}
