"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/useToast";
import { useEffect, useState } from "react";

function PasswordInput({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder: string;
}) {
  const [show, setShow] = useState(false);
  return (
    <div style={{ position: "relative" }}>
      <input
        className="input"
        type={show ? "text" : "password"}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        style={{ paddingRight: 44 }}
      />
      <button
        type="button"
        onClick={() => setShow((p) => !p)}
        style={{
          position: "absolute",
          right: 12,
          top: "50%",
          transform: "translateY(-50%)",
          background: "none",
          border: "none",
          cursor: "pointer",
          color: "var(--text-mute)",
          padding: 0,
          display: "flex",
          alignItems: "center",
        }}
        aria-label={show ? "Ocultar" : "Mostrar"}
      >
        {show ? (
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
          >
            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
            <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
            <line x1="1" y1="1" x2="23" y2="23" />
          </svg>
        ) : (
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
          >
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
        )}
      </button>
    </div>
  );
}

export default function SecurityPage() {
  const { session, loading } = useAuth();
  const router = useRouter();
  const { show, ToastContainer } = useToast();
  const [busy, setBusy] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const sameAsCurrentWarning =
    newPassword.length > 0 && newPassword === currentPassword;
  const passwordsMatchWarning =
    confirmPassword.length > 0 && newPassword !== confirmPassword;

  useEffect(() => {
    if (!loading && !session) router.replace("/login");
  }, [loading, session, router]);

  if (loading)
    return (
      <div
        style={{
          minHeight: "60vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 12,
            letterSpacing: "0.2em",
            color: "var(--accent)",
            animation: "pulse 1.5s ease-in-out infinite",
          }}
        >
          ◆
        </span>
        <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.2} }`}</style>
      </div>
    );

  if (!session) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!session) return;

    if (newPassword === currentPassword) {
      show("La nueva contraseña no puede ser igual a la actual", "error");
      return;
    }

    if (newPassword !== confirmPassword) {
      show("Las contraseñas no coinciden", "error");
      return;
    }

    const passwordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(newPassword)) {
      show(
        "La contraseña debe tener mayúscula, minúscula, número y símbolo (@$!%*?&)",
        "error",
      );
      return;
    }

    setBusy(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:8080"}/auth/change-password`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.accessToken}`,
          },
          body: JSON.stringify({
            currentPassword,
            newPassword,
            confirmPassword,
          }),
        },
      );

      const json = await res.json().catch(() => null);
      if (!res.ok) throw new Error(json?.message ?? `Error ${res.status}`);

      show("Contraseña actualizada correctamente", "success");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      show(err instanceof Error ? err.message : "Algo salió mal", "error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className="container page"
      style={{ display: "flex", flexDirection: "column", alignItems: "center" }}
    >
      <ToastContainer />
      <div style={{ width: "100%", maxWidth: 480 }}>
        <div className="crumbs">
          <Link href="/">Inicio</Link>
          <span className="sep">/</span>
          <Link href="/account">Cuenta</Link>
          <span className="sep">/</span>
          <em>Seguridad</em>
        </div>

        <div className="eyebrow" style={{ marginBottom: 12 }}>
          ◆ SEGURIDAD
        </div>
        <h1 className="display" style={{ fontSize: 48, marginBottom: 40 }}>
          CAMBIAR CONTRASEÑA.
        </h1>

        <form
          onSubmit={handleSubmit}
          noValidate
          style={{ display: "flex", flexDirection: "column", gap: 20 }}
        >
          <div
            className="card"
            style={{
              padding: 32,
              display: "flex",
              flexDirection: "column",
              gap: 20,
            }}
          >
            <div>
              <label
                className="mono"
                style={{
                  fontSize: 11,
                  letterSpacing: "0.14em",
                  color: "var(--text-mute)",
                  display: "block",
                  marginBottom: 8,
                }}
              >
                CONTRASEÑA ACTUAL
              </label>
              <PasswordInput
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Tu contraseña actual"
              />
            </div>

            <div>
              <label
                className="mono"
                style={{
                  fontSize: 11,
                  letterSpacing: "0.14em",
                  color: "var(--text-mute)",
                  display: "block",
                  marginBottom: 8,
                }}
              >
                NUEVA CONTRASEÑA
              </label>
              <PasswordInput
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Mínimo 8 caracteres"
              />
              <div
                style={{
                  fontSize: 11,
                  color: "var(--text-mute)",
                  marginTop: 6,
                  fontFamily: "var(--font-mono)",
                  lineHeight: 1.5,
                }}
              >
                Debe tener mayúscula, minúscula, número y símbolo (@$!%*?&)
              </div>
              {sameAsCurrentWarning && (
                <div
                  style={{
                    fontSize: 11,
                    color: "#ef4444",
                    marginTop: 6,
                    fontFamily: "var(--font-mono)",
                  }}
                >
                  ✕ La nueva contraseña no puede ser igual a la actual
                </div>
              )}
            </div>

            <div>
              <label
                className="mono"
                style={{
                  fontSize: 11,
                  letterSpacing: "0.14em",
                  color: "var(--text-mute)",
                  display: "block",
                  marginBottom: 8,
                }}
              >
                CONFIRMAR CONTRASEÑA
              </label>
              <PasswordInput
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repetí la nueva contraseña"
              />
              {passwordsMatchWarning && (
                <div
                  style={{
                    fontSize: 11,
                    color: "#ef4444",
                    marginTop: 6,
                    fontFamily: "var(--font-mono)",
                  }}
                >
                  ✕ Las contraseñas no coinciden
                </div>
              )}
            </div>
          </div>

          <div style={{ display: "flex", gap: 12 }}>
            <button
              className="btn btn-lg"
              type="submit"
              disabled={busy || sameAsCurrentWarning}
              style={{ flex: 1 }}
            >
              {busy ? "UN MOMENTO…" : "ACTUALIZAR CONTRASEÑA →"}
            </button>
            <Link href="/account" className="btn btn-ghost btn-lg">
              CANCELAR
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
