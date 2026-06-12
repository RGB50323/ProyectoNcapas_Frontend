"use client";
import { useEffect, useState } from "react";

type ToastType = "success" | "error" | "info" | "warning";

interface ToastProps {
  message: string;
  type?: ToastType;
  duration?: number;
  onClose: () => void;
}

const config: Record<ToastType, { icon: string; accent: string }> = {
  success: { icon: "◆", accent: "var(--accent, #e8d5b0)" },
  error: { icon: "✕", accent: "#ef4444" },
  info: { icon: "◇", accent: "var(--accent, #e8d5b0)" },
  warning: { icon: "⚠", accent: "#f59e0b" },
};

export function Toast({
  message,
  type = "info",
  duration = 3500,
  onClose,
}: ToastProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(onClose, 350);
    }, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const { icon, accent } = config[type];

  return (
    <div
      style={{
        position: "fixed",
        bottom: "2rem",
        right: "2rem",
        display: "flex",
        alignItems: "center",
        gap: "1rem",
        padding: "1rem 1.25rem",
        background: "var(--bg-1, #111)",
        border: `1px solid ${accent}`,
        borderLeft: `3px solid ${accent}`,
        color: "var(--text, #f5f0e8)",
        boxShadow: `0 8px 32px rgba(0,0,0,0.5), 0 0 0 1px rgba(0,0,0,0.2)`,
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(12px)",
        transition: "opacity 0.35s ease, transform 0.35s ease",
        zIndex: 9999,
        minWidth: "280px",
        maxWidth: "420px",
      }}
    >
      <span
        style={{
          fontFamily: "var(--font-mono, monospace)",
          fontSize: "0.9rem",
          color: accent,
          flexShrink: 0,
        }}
      >
        {icon}
      </span>

      <span
        style={{
          flex: 1,
          fontSize: "0.85rem",
          fontFamily: "var(--font-mono, monospace)",
          letterSpacing: "0.04em",
          color: "var(--text, #f5f0e8)",
          textTransform: "uppercase",
        }}
      >
        {message}
      </span>

      <button
        onClick={() => {
          setVisible(false);
          setTimeout(onClose, 350);
        }}
        style={{
          background: "none",
          border: "none",
          color: "var(--text-mute, #666)",
          cursor: "pointer",
          fontSize: "0.75rem",
          fontFamily: "var(--font-mono, monospace)",
          padding: 0,
          flexShrink: 0,
        }}
      >
        ✕
      </button>
    </div>
  );
}
