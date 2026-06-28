"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "./Icon";

export function DashHeader({ role, name }: { role: string; name: string }) {
  return (
    <div
      style={{
        borderBottom: "1px solid var(--border)",
        background: "var(--bg-1)",
        padding: "16px 32px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}
    >
      <div style={{ display: "flex", alignItems: "baseline", gap: 16 }}>
        <Link
          href="/"
          style={{ display: "flex", alignItems: "center", cursor: "pointer" }}
        >
          <img
            src="/logo.png"
            alt="Mister K"
            style={{
              height: 28,
              width: "auto",
              filter: "invert(1) sepia(0.12)",
              mixBlendMode: "screen",
              display: "block",
            }}
          />
          <span
            className="mono mute"
            style={{ marginLeft: 12, fontSize: 11, letterSpacing: "0.14em" }}
          >
            CONSOLA {role}
          </span>
        </Link>
        <span className="mono mute" style={{ marginLeft: 24 }}>
          v2.4.1 · {name}
        </span>
      </div>
      <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
        <span className="mono">
          <span className="live-dot" />
          &nbsp; OPS DEL LAB · EN LÍNEA
        </span>
        <button className="icon-btn" aria-label="Cuenta">
          <Icon.User />
        </button>
      </div>
    </div>
  );
}

function Item({
  children,
  href,
}: {
  children: React.ReactNode;
  href?: string;
}) {
  const pathname = usePathname();
  if (href) {
    return (
      <Link href={href} className={pathname === href ? "active" : ""}>
        {children}
      </Link>
    );
  }
  return <a>{children}</a>;
}

export function AdminSidebar() {
  return (
    <aside className="side">
      <div className="group">Resumen</div>
      <Item href="/admin/dashboard">Panel</Item>

      <div className="group">Personas</div>
      <Item href="/admin/users">Usuarios</Item>
      <Item href="/admin/sellers">Tiendas</Item>
      <Item href="/admin/store-requests">Solicitudes de tienda</Item>
      <Item href="/admin/addresses">Direcciones</Item>
      <Item href="/admin/reviews">Reseñas</Item>

      <div className="group">Operaciones</div>
      <Item href="/admin/orders">Pedidos</Item>
      <Item href="/admin/erp">ERP</Item>
      <Item href="/admin/verifications">Verificaciones</Item>

      <div className="group">Catálogo</div>
      <Item href="/admin/products">Productos</Item>
      <Item href="/admin/categories">Categorías</Item>
      <Item href="/admin/brands">Marcas</Item>
      <Item href="/admin/badges">Etiquetas</Item>

      <div className="group">Ventas</div>
      <Item href="/admin/shipping">Métodos de envío</Item>
      <Item href="/admin/coupons">Cupones</Item>
      <Item href="/admin/drops">Drops</Item>

      <div className="group">Analytics</div>
      <Item href="/admin/conversion">Conversión</Item>
    </aside>
  );
}

export function SellerSidebar() {
  return (
    <aside className="side">
      <div className="group">Resumen</div>
      <Item href="/seller/dashboard">Panel</Item>

      <div className="group">Productos</div>
      <Item href="/seller/products">Mis productos</Item>
      <Item href="/seller/reviews">Reseñas</Item>

      <div className="group">Ventas</div>
      <Item href="/seller/drops">Drops</Item>

      <div className="group">Cuenta</div>
      <Item href="/seller/profile">Perfil de tienda</Item>
    </aside>
  );
}

export function Funnel() {
  const data = [
    { label: "VISITAS", count: 24800, pct: 100, col: "var(--text)" },
    {
      label: "VISTAS DE PRODUCTO",
      count: 12420,
      pct: 50.1,
      col: "var(--text-dim)",
    },
    {
      label: "AGREGADO AL CARRITO",
      count: 2820,
      pct: 11.4,
      col: "var(--text-mute)",
    },
    {
      label: "CHECKOUT INICIADO",
      count: 1410,
      pct: 5.7,
      col: "var(--border-bright)",
    },
    { label: "COMPRADO", count: 952, pct: 3.84, col: "var(--accent-2)" },
  ];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {data.map((d, i) => (
        <div
          key={d.label}
          style={{
            display: "grid",
            gridTemplateColumns: "180px 1fr 120px",
            alignItems: "center",
            gap: 16,
          }}
        >
          <div
            className="mono"
            style={{
              letterSpacing: "0.14em",
              fontSize: 12,
              color: "var(--text-dim)",
            }}
          >
            {String(i + 1).padStart(2, "0")} · {d.label}
          </div>
          <div
            style={{
              height: 32,
              background: "var(--card)",
              borderRadius: 0,
              overflow: "hidden",
              border: "1px solid var(--border)",
            }}
          >
            <div
              style={{
                height: "100%",
                width: `${d.pct}%`,
                background: d.col,
                display: "flex",
                alignItems: "center",
                paddingLeft: 12,
                fontFamily: "var(--font-mono)",
                fontSize: 12,
                color: "var(--bg-0)",
                fontWeight: 600,
                letterSpacing: "0.08em",
              }}
            >
              {d.pct.toFixed(1)}%
            </div>
          </div>
          <div className="display" style={{ fontSize: 18, textAlign: "right" }}>
            {d.count.toLocaleString()}
          </div>
        </div>
      ))}
      <div
        style={{
          marginTop: 16,
          padding: 16,
          background: "var(--bg-1)",
          border: "1px dashed var(--border)",
          borderRadius: 0,
          display: "flex",
          justifyContent: "space-between",
        }}
      >
        <div>
          <span className="mono mute">ABANDONO · CARRITO → CHECKOUT</span>
        </div>
        <div
          className="display"
          style={{ fontSize: 20, color: "var(--accent-2)" }}
        >
          50.0%
        </div>
      </div>
    </div>
  );
}
