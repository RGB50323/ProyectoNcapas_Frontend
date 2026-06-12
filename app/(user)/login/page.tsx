"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAuth, type Session } from "@/lib/auth";
import { useToast } from "@/hooks/useToast";
import Link from "next/link";
import { PageLoader } from "@/components/PageLoader";

function destinationFor(session: Session) {
  return "/";
}

function HintField({ hint, children }: { hint?: string; children: ReactNode }) {
  if (!hint) return <>{children}</>;
  return (
    <div>
      {children}
      <div
        style={{
          fontSize: 11,
          color: "var(--text-mute)",
          marginTop: 6,
          lineHeight: 1.5,
          fontFamily: "var(--font-mono)",
        }}
      >
        {hint}
      </div>
    </div>
  );
}

function PasswordInput({
  placeholder,
  value,
  onChange,
  autoComplete,
}: {
  placeholder: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  autoComplete?: string;
}) {
  const [show, setShow] = useState(false);
  return (
    <div style={{ position: "relative" }}>
      <input
        className="input"
        type={show ? "text" : "password"}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        autoComplete={autoComplete}
        style={{ paddingRight: 44 }}
      />
      <button
        type="button"
        onClick={() => setShow((prev) => !prev)}
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
        aria-label={show ? "Ocultar contraseña" : "Mostrar contraseña"}
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

export default function LoginPage() {
  const router = useRouter();
  const { session, loading, login, register } = useAuth();
  const { show, ToastContainer } = useToast();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [busy, setBusy] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [phone, setPhone] = useState("");

  useEffect(() => {
    if (!loading && session) router.replace(destinationFor(session));
  }, [loading, session, router]);

  function validateRegister(): string | null {
    if (!firstName.trim()) return "El nombre es requerido";
    if (!lastName.trim()) return "El apellido es requerido";

    if (!email.trim()) return "El correo es requerido";
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email)) return "Formato de email incorrecto";

    if (password.length < 8)
      return "La contraseña debe tener al menos 8 caracteres";
    const passwordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(password))
      return "La contraseña debe tener mayúscula, minúscula, número y símbolo (@$!%*?&)";
    if (password !== confirmPassword) return "Las contraseñas no coinciden";

    if (phone && !/^\+?[0-9]{8,15}$/.test(phone))
      return "Formato de teléfono inválido";
    return null;
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);

    try {
      if (mode === "login") {
        if (!email.trim()) {
          show("El correo es requerido", "error");
          setBusy(false);
          return;
        }
        if (!password.trim()) {
          show("La contraseña es requerida", "error");
          setBusy(false);
          return;
        }
        const s = await login(email, password);
        show("Bienvenido de vuelta", "success");
        router.replace(destinationFor(s));
        return;
      }

      const validationError = validateRegister();
      if (validationError) {
        show(validationError, "error");
        setBusy(false);
        return;
      }

      const s = await register({
        firstName,
        lastName,
        email,
        password,
        confirmPassword,
        phone: phone || undefined,
      });
      show("Bienvenido al Lab", "success");
      router.replace(destinationFor(s));
      setBusy(false);
    } catch (err) {
      show(
        err instanceof Error ? err.message : "Algo salió mal, intentá de nuevo",
        "error",
      );
      setBusy(false);
    }
  }

  function switchMode(next: "login" | "register") {
    setMode(next);
  }

  if (loading || session) return <PageLoader />;

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
        <div className="eyebrow" style={{ marginBottom: 12 }}>
          ◆ ACCESO AL LAB
        </div>
        <h1 className="display" style={{ fontSize: 48, marginBottom: 32 }}>
          {mode === "login" ? "INICIAR SESIÓN." : "CREAR CUENTA."}
        </h1>

        <div
          style={{
            display: "flex",
            gap: 0,
            marginBottom: 32,
            borderBottom: "1px solid var(--border)",
          }}
        >
          {(
            [
              ["login", "Ya tengo cuenta"],
              ["register", "Soy nuevo"],
            ] as const
          ).map(([k, l]) => (
            <button
              key={k}
              onClick={() => switchMode(k)}
              className="mono"
              style={{
                background: "transparent",
                border: "none",
                cursor: "pointer",
                padding: "12px 18px",
                textTransform: "uppercase",
                color: mode === k ? "var(--text)" : "var(--text-mute)",
                borderBottom: `1px solid ${mode === k ? "var(--accent)" : "transparent"}`,
                marginBottom: -1,
              }}
            >
              {l}
            </button>
          ))}
        </div>

        <form
          onSubmit={handleSubmit}
          noValidate
          style={{ display: "flex", flexDirection: "column", gap: 16 }}
        >
          {mode === "register" && (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 16,
              }}
            >
              <input
                className="input"
                placeholder="Nombre"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
              />
              <input
                className="input"
                placeholder="Apellido"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
              />
            </div>
          )}

          <input
            className="input"
            type="email"
            placeholder="Correo"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
          />

          <HintField
            hint={
              mode === "register"
                ? "Mínimo 8 caracteres, con al menos una mayúscula, una minúscula, un número y un símbolo (@$!%*?&)."
                : undefined
            }
          >
            <PasswordInput
              placeholder="Contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={
                mode === "login" ? "current-password" : "new-password"
              }
            />
          </HintField>

          {mode === "register" && (
            <>
              <PasswordInput
                placeholder="Confirmar contraseña"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
              />
              <input
                className="input"
                type="tel"
                placeholder="Teléfono (opcional)"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </>
          )}

          <button
            className="btn btn-lg"
            type="submit"
            disabled={busy}
            style={{ marginTop: 8 }}
          >
            {busy
              ? "UN MOMENTO…"
              : mode === "login"
                ? "ENTRAR AL LAB →"
                : "CREAR CUENTA →"}
          </button>

          {mode === "login" && (
            <Link
              href="/forgot-password"
              className="mono"
              style={{
                fontSize: 11,
                letterSpacing: "0.12em",
                color: "var(--text-mute)",
                textAlign: "center",
                textTransform: "uppercase",
                marginTop: 4,
              }}
            >
              ¿Olvidaste tu contraseña?
            </Link>
          )}
        </form>
      </div>
    </div>
  );
}
