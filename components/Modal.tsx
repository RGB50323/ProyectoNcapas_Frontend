"use client";

import { useEffect } from "react";

type ModalProps = {
  open: boolean;
  title?: string;
  onClose: () => void;
  children: React.ReactNode;
  width?: number | string;
};

export default function Modal({
  open,
  title,
  onClose,
  children,
  width = 520,
}: ModalProps) {
  useEffect(() => {
    if (!open) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.55)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
        padding: 20,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width,
          maxWidth: "100%",
          background: "var(--bg-1)",
          border: "1px solid var(--border)",
          borderRadius: 6,
          boxShadow: "0 20px 60px rgba(0,0,0,0.4)",
        }}
      >
        {(title || true) && (
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "14px 16px",
              borderBottom: "1px solid var(--border)",
            }}
          >
            <div className="display" style={{ fontSize: 14 }}>
              {title}
            </div>

            <button
              onClick={onClose}
              className="btn btn-ghost"
              style={{ padding: "6px 10px" }}
            >
              ✕
            </button>
          </div>
        )}

        <div style={{ padding: 16 }}>{children}</div>
      </div>
    </div>
  );
}
