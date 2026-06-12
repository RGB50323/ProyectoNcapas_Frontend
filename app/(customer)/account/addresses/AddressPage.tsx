"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth, authFetch, getUserId } from "@/lib/auth";

type Address = {
  id: string;
  label?: string;
  street: string;
  city: string;
  state?: string;
  country?: string;
  zip?: string;
  isDefault?: boolean;
};

export default function AddressPage() {
  const router = useRouter();
  const { session } = useAuth();

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!session) return;
    const load = async () => {
      try {
        setLoading(true);

        const userId = getUserId(session!);

        if (!userId) {
          throw new Error("No se pudo obtener el userId");
        }

        const res = await authFetch(`/addresses/user/${userId}`, session!);

        const json = await res.json();

        if (!res.ok) {
          throw new Error(json?.message || "Error cargando direcciones");
        }

        setAddresses(json?.data ?? json ?? []);
      } catch (err: any) {
        setError(err.message ?? "Error inesperado");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [session]);

  if (!session) return null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* HEAER */}
      <div className="card" style={{ padding: 28 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            borderBottom: "1px solid var(--border)",
            paddingBottom: 16,
            marginBottom: 16,
          }}
        >
          <h2 className="display" style={{ fontSize: 18 }}>
            DIRECCIONES
          </h2>

          <button
            className="btn"
            onClick={() => router.push("/account/addresses/new")}
          >
            + Nueva dirección
          </button>
        </div>

        <p className="mute" style={{ fontSize: 13 }}>
          Administra tus direcciones de envío registradas en tu cuenta.
        </p>
      </div>

      <div className="card" style={{ padding: 28 }}>
        {loading && <p className="mute">Cargando direcciones...</p>}

        {error && <p style={{ color: "#e05252", fontSize: 12 }}>{error}</p>}

        {!loading && !error && addresses.length === 0 && (
          <p className="mute">No tienes direcciones registradas.</p>
        )}

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
            gap: 16,
          }}
        >
          {addresses.map((addr) => (
            <div
              key={addr.id}
              style={{
                border: "1px solid var(--border)",
                padding: 20,
                background: "var(--card)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: 10,
                }}
              >
                <div className="mono mute" style={{ fontSize: 11 }}>
                  {addr.label || "DIRECCIÓN"}
                </div>

                {addr.isDefault && (
                  <span
                    style={{
                      fontSize: 10,
                      fontFamily: "var(--font-mono)",
                      color: "var(--ok)",
                      border: "1px solid var(--ok)",
                      padding: "2px 8px",
                    }}
                  >
                    PRINCIPAL
                  </span>
                )}
              </div>

              <div style={{ fontSize: 14, marginBottom: 6 }}>{addr.street}</div>

              <div className="mute" style={{ fontSize: 12 }}>
                {[addr.city, addr.state, addr.country]
                  .filter(Boolean)
                  .join(", ")}
              </div>

              {addr.zip && (
                <div
                  className="mono mute"
                  style={{ fontSize: 11, marginTop: 6 }}
                >
                  CP: {addr.zip}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
