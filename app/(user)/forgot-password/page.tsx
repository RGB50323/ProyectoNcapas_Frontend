"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useToast } from "@/hooks/useToast";

const API = process.env.NEXT_PUBLIC_BACKEND_URL;

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

export default function ForgotPasswordPage() {
  const router = useRouter();
  const { show, ToastContainer } = useToast();
  const [step, setStep] = useState<"email" | "reset">("email");
  const [busy, setBusy] = useState(false);

  const [email, setEmail] = useState("");
  const [token, setToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const passwordsMatchWarning =
    confirmPassword.length > 0 && newPassword !== confirmPassword;

  async function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault();
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!email.trim() || !emailRegex.test(email)) {
      show("Ingresá un correo válido", "error");
      return;
    }

    setBusy(true);
    try {
      const res = await fetch(`${API}/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) throw new Error(json?.message ?? `Error ${res.status}`);
      show("Revisá tu correo, te enviamos el código", "success");
      setStep("reset");
    } catch (err) {
      show(err instanceof Error ? err.message : "Algo salió mal", "error");
    } finally {
      setBusy(false);
    }
  }

  async function handleResetSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!/^\d{6}$/.test(token.trim())) {
      show("Ingresá el código de 6 dígitos que recibiste por correo", "error");
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
      const res = await fetch(`${API}/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, token, newPassword, confirmPassword }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) throw new Error(json?.message ?? `Error ${res.status}`);
      show("Contraseña restablecida correctamente", "success");
      setTimeout(() => router.replace("/login"), 1500);
    } catch (err) {
      show(err instanceof Error ? err.message : "Algo salió mal", "error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className="container page"
      style={{
        display: "flex",
        justifyContent: "center",
        padding: "80px 32px",
      }}
    >
      <ToastContainer />
      <div style={{ width: "100%", maxWidth: 440 }}>
        <div className="crumbs" style={{ marginBottom: 32 }}>
          <Link href="/login">Iniciar sesión</Link>
          <span className="sep">/</span>
          <em>Recuperar contraseña</em>
        </div>

        <div className="eyebrow" style={{ marginBottom: 12 }}>
          ◆ RECUPERAR ACCESO
        </div>

        {step === "email" ? (
          <>
            <h1 className="display" style={{ fontSize: "clamp(26px, 8vw, 48px)", marginBottom: 40 }}>
              OLVIDÉ MI CONTRASEÑA.
            </h1>
            <form
              onSubmit={handleEmailSubmit}
              noValidate
              style={{ display: "flex", flexDirection: "column", gap: 16 }}
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
                  CORREO ELECTRÓNICO
                </label>
                <input
                  className="input"
                  type="email"
                  placeholder="tu@correo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoFocus
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
                  Te enviaremos un código que expira en 15 minutos.
                </div>
              </div>
              <div style={{ display: "flex", gap: 12 }}>
                <button
                  className="btn btn-lg"
                  type="submit"
                  disabled={busy}
                  style={{ flex: 1 }}
                >
                  {busy ? "ENVIANDO…" : "ENVIAR CÓDIGO →"}
                </button>
                <Link href="/login" className="btn btn-ghost btn-lg">
                  CANCELAR
                </Link>
              </div>
            </form>
          </>
        ) : (
          <>
            <h1 className="display" style={{ fontSize: "clamp(30px, 9vw, 48px)", marginBottom: 12 }}>
              NUEVA CONTRASEÑA.
            </h1>
            <p
              className="mono mute"
              style={{ fontSize: 12, lineHeight: 1.6, marginBottom: 40 }}
            >
              Revisá tu correo{" "}
              <span style={{ color: "var(--accent)" }}>{email}</span> y escribí
              el código de 6 dígitos que te enviamos.
            </p>
            <form
              onSubmit={handleResetSubmit}
              noValidate
              style={{ display: "flex", flexDirection: "column", gap: 16 }}
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
                  CÓDIGO
                </label>
                <input
                  className="input"
                  type="text"
                  inputMode="numeric"
                  placeholder="123456"
                  maxLength={6}
                  value={token}
                  onChange={(e) =>
                    setToken(e.target.value.replace(/\D/g, "").slice(0, 6))
                  }
                  autoFocus
                  style={{
                    fontFamily: "var(--font-mono)",
                    letterSpacing: "0.3em",
                    textAlign: "center",
                    fontSize: 20,
                  }}
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

              <div style={{ display: "flex", gap: 12 }}>
                <button
                  className="btn btn-lg"
                  type="submit"
                  disabled={busy || passwordsMatchWarning}
                  style={{ flex: 1 }}
                >
                  {busy ? "UN MOMENTO…" : "RESTABLECER CONTRASEÑA →"}
                </button>
                <button
                  type="button"
                  onClick={() => setStep("email")}
                  className="btn btn-ghost btn-lg"
                >
                  ATRÁS
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
