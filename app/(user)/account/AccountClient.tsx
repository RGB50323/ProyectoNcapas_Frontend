"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth, getUserId, authFetch } from "@/lib/auth";
import type { Order, Product } from "@/lib/types";
import { Icon } from "@/components/Icon";
import ProductCard from "@/components/ProductCard";
import { StatusPill, Field } from "@/components/ui";
import { PageLoader } from "@/components/PageLoader";
import AddressPage from "./addresses/AddressPage";

const TABS: [string, string, string | null][] = [
  ["orders", "Mis pedidos", "14"],
  ["wishlist", "Lista de deseos", "8"],
  ["returns", "Devoluciones", "1"],
  ["addresses", "Direcciones", null],
  ["payment", "Métodos de pago", "3"],
];

function OrderDetail({ order }: { order: Order }) {
  const steps = [
    { k: "NEW", l: "Pedido realizado", d: "22 may · 14:02" },
    { k: "PAID", l: "Pago verificado", d: "22 may · 14:04" },
    { k: "PREPARING", l: "Inspeccionado por el Lab", d: "22 may · 18:32" },
    { k: "SHIPPED", l: "Despachado · DHL", d: "24 may · 09:11" },
    { k: "DELIVERED", l: "Entregado", d: "Estimado 28 may" },
  ];
  const currentIdx = steps.findIndex((s) => s.k === order.status);
  const trackPct =
    currentIdx === 0 ? 0 : (currentIdx / (steps.length - 1)) * 100;

  return (
    <div
      style={{
        padding: 24,
        background: "var(--bg-1)",
        borderTop: "1px solid var(--border)",
      }}
    >
      <div style={{ marginBottom: 32 }}>
        <div
          className="display"
          style={{
            fontSize: 12,
            letterSpacing: "0.14em",
            color: "var(--text-mute)",
            marginBottom: 20,
          }}
        >
          LÍNEA DE ENVÍO · {order.tracking}
        </div>

        {/* Track + nodes */}
        <div style={{ position: "relative", marginBottom: 16 }}>
          <div
            style={{
              position: "absolute",
              top: 13,
              left: 13,
              right: 13,
              height: 1,
              background: "var(--border)",
            }}
          />
          <div
            style={{
              position: "absolute",
              top: 13,
              left: 13,
              height: 1,
              width: `calc((100% - 26px) * ${trackPct} / 100)`,
              background: "var(--accent)",
              transition: "width 0.4s ease",
            }}
          />
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              position: "relative",
            }}
          >
            {steps.map((s, i) => {
              const done = i < currentIdx;
              const active = i === currentIdx;
              return (
                <div
                  key={s.k}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    position: "relative",
                  }}
                >
                  <div
                    style={{
                      width: 26,
                      height: 26,
                      background: done
                        ? "var(--accent)"
                        : active
                          ? "var(--bg-0)"
                          : "var(--bg-1)",
                      border: `1px solid ${done || active ? "var(--accent)" : "var(--border)"}`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontFamily: "var(--font-mono)",
                      fontSize: 10,
                      letterSpacing: "0.08em",
                      color: done
                        ? "var(--bg-0)"
                        : active
                          ? "var(--accent)"
                          : "var(--text-mute)",
                      position: "relative",
                      zIndex: 1,
                    }}
                  >
                    {done ? "◆" : `0${i + 1}`}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Labels row */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: `repeat(${steps.length}, 1fr)`,
            gap: 4,
          }}
        >
          {steps.map((s, i) => {
            const done = i <= currentIdx;
            return (
              <div key={s.k}>
                <div
                  style={{
                    fontFamily: "var(--font-display)",
                    fontSize: 11,
                    textTransform: "uppercase",
                    letterSpacing: "0.04em",
                    lineHeight: 1.3,
                    color: done ? "var(--text)" : "var(--text-mute)",
                  }}
                >
                  {s.l}
                </div>
                <div
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: 11,
                    letterSpacing: "0.1em",
                    color: "var(--text-mute)",
                    marginTop: 4,
                  }}
                >
                  {s.d}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: 40,
          borderTop: "1px solid var(--border)",
          paddingTop: 24,
        }}
      >
        <div>
          <div
            className="display"
            style={{
              fontSize: 12,
              letterSpacing: "0.14em",
              color: "var(--text-mute)",
              marginBottom: 10,
            }}
          >
            ENVIAR A
          </div>
          <div
            style={{ fontSize: 13, lineHeight: 1.7, color: "var(--text-dim)" }}
          >
            MARIO SANDOVAL
            <br />
            Calle La Reforma 4012
            <br />
            Edificio Vortex · Piso 8<br />
            San Salvador, El Salvador 01101
          </div>
        </div>
        <div
          style={{ display: "flex", gap: 8, flexWrap: "wrap", flexShrink: 0 }}
        >
          <button className="btn btn-ghost" style={{ padding: "8px 14px" }}>
            Rastrear envío
          </button>
          <button className="btn btn-ghost" style={{ padding: "8px 14px" }}>
            Factura XML
          </button>
          <button className="btn btn-ghost" style={{ padding: "8px 14px" }}>
            Factura PDF
          </button>
          {order.status === "DELIVERED" && (
            <button className="btn btn-outline" style={{ padding: "8px 14px" }}>
              Solicitar devolución
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function OrdersTab({ orders }: { orders: Order[] }) {
  const [open, setOpen] = useState<string | null>("KL-24138");
  return (
    <div>
      <div className="display" style={{ fontSize: 24, marginBottom: 24 }}>
        PEDIDOS RECIENTES
      </div>
      {orders.map((o) => (
        <div
          key={o.id}
          className="card"
          style={{ padding: 0, marginBottom: 16, overflow: "hidden" }}
        >
          <div
            onClick={() => setOpen(open === o.id ? null : o.id)}
            style={{
              padding: 20,
              display: "grid",
              gridTemplateColumns: "1fr 1fr 1fr 1fr auto",
              gap: 16,
              alignItems: "center",
              cursor: "pointer",
            }}
          >
            <div>
              <div className="mono mute">PEDIDO</div>
              <div className="display" style={{ fontSize: 14, marginTop: 4 }}>
                {o.id}
              </div>
            </div>
            <div>
              <div className="mono mute">FECHA</div>
              <div style={{ marginTop: 4, fontSize: 13 }}>{o.date}</div>
            </div>
            <div>
              <div className="mono mute">ESTADO</div>
              <div style={{ marginTop: 4 }}>
                <StatusPill status={o.status} />
              </div>
            </div>
            <div>
              <div className="mono mute">TOTAL</div>
              <div className="display" style={{ fontSize: 16, marginTop: 4 }}>
                ${o.total}
              </div>
            </div>
            <button className="btn btn-ghost" style={{ padding: "8px 14px" }}>
              Detalles
            </button>
          </div>
          {open === o.id && <OrderDetail order={o} />}
        </div>
      ))}
    </div>
  );
}

function WishlistTab({ items }: { items: Product[] }) {
  return (
    <div>
      <div className="display" style={{ fontSize: 24, marginBottom: 24 }}>
        LISTA DE DESEOS · {items.length} PIEZAS
      </div>
      <div className="grid-products">
        {items.map((p) => (
          <ProductCard key={p.id} p={p} />
        ))}
      </div>
    </div>
  );
}

function ReturnsTab() {
  return (
    <div>
      <div className="display" style={{ fontSize: 24, marginBottom: 24 }}>
        DEVOLUCIONES Y REEMBOLSOS
      </div>
      <div className="card" style={{ padding: 24 }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr 1fr auto",
            gap: 16,
            alignItems: "center",
          }}
        >
          <div>
            <div className="mono mute">DEVOLUCIÓN</div>
            <div className="display" style={{ fontSize: 14, marginTop: 4 }}>
              RT-118
            </div>
          </div>
          <div>
            <div className="mono mute">PEDIDO</div>
            <div style={{ marginTop: 4, fontSize: 13 }}>KL-24102</div>
          </div>
          <div>
            <div className="mono mute">MOTIVO</div>
            <div style={{ marginTop: 4, fontSize: 13 }}>Talla</div>
          </div>
          <div>
            <div className="mono mute">ESTADO</div>
            <div style={{ marginTop: 4 }}>
              <span className="pill yellow">
                <Icon.Dot /> EN REVISIÓN
              </span>
            </div>
          </div>
          <button className="btn btn-ghost" style={{ padding: "8px 14px" }}>
            Ver
          </button>
        </div>
        <div
          style={{
            marginTop: 24,
            padding: 16,
            background: "var(--bg-0)",
            borderRadius: 2,
            border: "1px dashed var(--border)",
          }}
        >
          <div className="mono accent" style={{ marginBottom: 6 }}>
            ◇ PROGRESO DEL REEMBOLSO
          </div>
          <div className="mute" style={{ fontSize: 13 }}>
            El reembolso de{" "}
            <strong style={{ color: "var(--text)" }}>$240.00</strong> se
            procesará en 24h una vez que el laboratorio complete la inspección.
            Recibirás una nota de crédito en factura XML cuando se finalice.
          </div>
        </div>
      </div>
    </div>
  );
}

function PaymentMethodsTab() {
  const cards = [
    { brand: "VISA", num: "•••• 4242", exp: "04/28", primary: true },
    { brand: "MASTERCARD", num: "•••• 8821", exp: "11/27", primary: false },
    { brand: "BANCO", num: "BANCO AGRÍCOLA", exp: "—", primary: false },
  ];
  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: 24,
        }}
      >
        <div className="display" style={{ fontSize: 24 }}>
          MÉTODOS DE PAGO
        </div>
        <button className="btn">+ Agregar método</button>
      </div>
      <div
        style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}
      >
        {cards.map((c, i) => (
          <div key={i} className="card" style={{ padding: 20 }}>
            <div className="mono mute">{c.brand}</div>
            <div
              className="display"
              style={{ fontSize: 18, marginTop: 12, letterSpacing: "0.08em" }}
            >
              {c.num}
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginTop: 16,
              }}
            >
              <span className="mono mute">VENCE {c.exp}</span>
              {c.primary && <span className="mono accent">PREDETERMINADA</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function AccountClient({
  orders,
  wishlist,
}: {
  orders: Order[];
  wishlist: Product[];
}) {
  const [tab, setTab] = useState("orders");
  const [addresses, setAddresses] = useState<any[]>([]);
  const [addressCount, setAddressCount] = useState(0);
  const router = useRouter();
  const { session, loading, logout } = useAuth();

  const tabsWithCounts = TABS.map(([k, label, count]) => {
    if (k === "addresses") {
      return [k, label, String(addressCount)];
    }
    return [k, label, count ?? ""];
  });

  useEffect(() => {
    if (!loading && !session) router.replace("/login");
  }, [loading, session, router]);

  useEffect(() => {
    if (!session) return;

    let cancelled = false;

    const load = async () => {
      const userId = getUserId(session);
      if (!userId) return;

      const res = await authFetch(`/addresses/user/${userId}`, session);
      const json = await res.json();

      const data = json?.data ?? [];

      if (!cancelled) {
        setAddresses(data);
        setAddressCount(data.length);
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [session]);

  if (loading || !session) return <PageLoader />;

  return (
    <div className="container page">
      <div className="crumbs">
        <Link href="/">Inicio</Link>
        <span className="sep">/</span>
        <em>Cuenta</em>
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "end",
          marginBottom: 48,
          paddingBottom: 24,
          borderBottom: "1px solid var(--border)",
        }}
      >
        <div>
          <h1 className="display" style={{ fontSize: 56, marginTop: 12 }}>
            HOLA, {session.firstName.toUpperCase()}.
          </h1>
          <p className="mute" style={{ marginTop: 8, fontSize: 14 }}>
            {session.email} · Rol <span className="accent">{session.role}</span>
          </p>
        </div>
        <div style={{ display: "flex", gap: 12 }}>
          <button
            className="btn btn-outline"
            onClick={() => router.push("/account/profile")}
          >
            Ver perfil
          </button>
          <button
            className="btn btn-ghost"
            onClick={async () => {
              await logout();
              router.replace("/");
            }}
          >
            Cerrar sesión
          </button>
        </div>
      </div>

      <div
        style={{ display: "grid", gridTemplateColumns: "220px 1fr", gap: 48 }}
      >
        <nav style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {tabsWithCounts.map(([k, l, c]) => (
            <button
              key={k}
              onClick={() =>
                k === "security" ? router.push("/account/security") : setTab(k)
              }
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "12px 14px",
                borderRadius: 4,
                background: tab === k ? "var(--card)" : "transparent",
                borderTop: "none",
                borderRight: "none",
                borderBottom: "none",
                borderLeft:
                  "2px solid " + (tab === k ? "var(--accent)" : "transparent"),
                color: tab === k ? "var(--text)" : "var(--text-dim)",
                fontSize: 13,
                cursor: "pointer",
                textAlign: "left",
                paddingLeft: 12,
              }}
            >
              <span>{l}</span>
              {c && (
                <span className="mono mute" style={{ fontSize: 11 }}>
                  {c}
                </span>
              )}
            </button>
          ))}
        </nav>

        <div>
          {tab === "orders" && <OrdersTab orders={orders} />}
          {tab === "wishlist" && <WishlistTab items={wishlist} />}
          {tab === "returns" && <ReturnsTab />}
          {tab === "addresses" && <AddressPage />}
          {tab === "payment" && <PaymentMethodsTab />}
        </div>
      </div>
    </div>
  );
}
