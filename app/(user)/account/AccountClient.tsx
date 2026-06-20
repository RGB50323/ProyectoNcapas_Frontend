"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth, getUserId, authFetch } from "@/lib/auth";
import { useWishlist } from "@/lib/wishlist";
import { getOrdersByCustomer, getReviewsByUser } from "@/lib/api";
import type { Order, Product, Review } from "@/lib/types";
import ProductCard from "@/components/ProductCard";
import { StatusPill } from "@/components/ui";
import { PageLoader } from "@/components/PageLoader";
import AddressPage from "./addresses/AddressPage";
import ReviewsTab from "./reviews/ReviewsTab";

const TABS: [string, string, string | null][] = [
    ["orders", "Mis pedidos", null],
    ["wishlist", "Lista de deseos", null],
    ["addresses", "Direcciones", null],
    ["reviews", "Mis reviews", null],
];

function OrderDetail({ order }: { order: Order }) {
    const steps = [
        { k: "PENDING", l: "Pedido realizado", d: "—" },
        { k: "CONFIRMED", l: "Pago verificado", d: "—" },
        { k: "PREPARING", l: "Inspeccionado por el Lab", d: "—" },
        { k: "SHIPPED", l: "Despachado · DHL", d: "—" },
        { k: "DELIVERED", l: "Entregado", d: "—" },
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
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Detalle de la orden */}
            {(order.subtotal !== undefined || order.shippingMethodName) && (
                <div style={{ marginBottom: 24, paddingBottom: 24, borderBottom: "1px solid var(--border)" }}>
                    {order.shippingAddressStreet && (
                        <div style={{ marginBottom: 8 }}>
                            <span className="mono mute">DIRECCIÓN: </span>
                            {order.shippingAddressStreet}, {order.shippingAddressCity}, {order.shippingAddressCountry}
                        </div>
                    )}
                    {order.shippingMethodName && (
                        <div style={{ marginBottom: 8 }}>
                            <span className="mono mute">ENVÍO: </span>{order.shippingMethodName}
                        </div>
                    )}
                    {order.couponCode && (
                        <div style={{ marginBottom: 8 }}>
                            <span className="mono mute">CUPÓN: </span>{order.couponCode}
                        </div>
                    )}
                    {order.subtotal !== undefined && (
                        <div style={{ marginTop: 12 }}>
                            <div style={{ display: "flex", justifyContent: "space-between" }}>
                                <span className="mono mute">Subtotal</span>
                                <span>${order.subtotal}</span>
                            </div>
                            {order.shippingCost !== undefined && (
                                <div style={{ display: "flex", justifyContent: "space-between" }}>
                                    <span className="mono mute">Envío</span>
                                    <span>${order.shippingCost}</span>
                                </div>
                            )}
                            {order.discountAmount !== undefined && order.discountAmount > 0 && (
                                <div style={{ display: "flex", justifyContent: "space-between", color: "var(--accent-2)" }}>
                                    <span className="mono">Descuento</span>
                                    <span>-${order.discountAmount}</span>
                                </div>
                            )}
                            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, fontWeight: 700 }}>
                                <span className="display" style={{ fontSize: 14 }}>TOTAL</span>
                                <span className="display" style={{ fontSize: 18 }}>${order.total}</span>
                            </div>
                        </div>
                    )}
                </div>
            )}

            <div
                style={{
                    display: "flex",
                    gap: 8,
                    flexWrap: "wrap",
                    flexShrink: 0,
                }}
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
    );
}

function OrdersTab({ orders }: { orders: Order[] }) {
    const [open, setOpen] = useState<string | null>(null);

    if (orders.length === 0) {
        return (
            <div>
                <div className="display" style={{ fontSize: 24, marginBottom: 24 }}>
                    PEDIDOS RECIENTES
                </div>
                <div className="card" style={{ padding: 48, textAlign: "center" }}>
                    <div className="display" style={{ fontSize: 20 }}>Aún no tienes pedidos.</div>
                    <Link href="/catalog" className="btn" style={{ marginTop: 16 }}>
                        Explorar el catálogo
                    </Link>
                </div>
            </div>
        );
    }

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
                                {o.id.slice(0, 8).toUpperCase()}
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
                            {open === o.id ? "Cerrar" : "Detalles"}
                        </button>
                    </div>
                    {open === o.id && <OrderDetail order={o} />}
                </div>
            ))}
        </div>
    );
}

function WishlistTab({ products }: { products: Product[] }) {
    const { items } = useWishlist();
    const wished = products.filter((p) => items.some((w) => w.productId === p.id));
    return (
        <div>
            <div className="display" style={{ fontSize: 24, marginBottom: 24 }}>
                LISTA DE DESEOS · {wished.length} PIEZAS
            </div>
            {wished.length === 0 ? (
                <div className="card" style={{ padding: 48, textAlign: "center" }}>
                    <div className="display" style={{ fontSize: 20 }}>Aún no tienes favoritos.</div>
                    <Link href="/catalog" className="btn" style={{ marginTop: 16 }}>Explorar el catálogo</Link>
                </div>
            ) : (
                <div className="grid-products">
                    {wished.map((p) => (
                        <ProductCard key={p.id} p={p} />
                    ))}
                </div>
            )}
        </div>
    );
}

// ─── Componente principal ─────────────────────────────────────
export default function AccountClient() {
    const searchParams = useSearchParams();
    const requestedTab = searchParams.get("tab") ?? "";
    const [tab, setTab] = useState(
        ["orders", "wishlist", "addresses"].includes(requestedTab)
            ? requestedTab
            : "orders",
    );
    const [orders, setOrders] = useState<Order[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [addresses, setAddresses] = useState<any[]>([]);
    const [addressCount, setAddressCount] = useState(0);
    const router = useRouter();
    const { session, loading, logout } = useAuth();
    const { count: wishCount } = useWishlist();
    const [reviews, setReviews] = useState<Review[]>([]);
    const [reviewCount, setReviewCount] = useState(0);

    const tabsWithCounts = TABS.map(([k, label, count]) => {
    if (k === "addresses") return [k, label, String(addressCount)];
    if (k === "wishlist") return [k, label, String(wishCount)];
    if (k === "orders") return [k, label, String(orders.length)];
    if (k === "reviews") return [k, label, String(reviewCount)];
    return [k, label, count ?? ""];
});

    useEffect(() => {
        if (!loading && !session) router.replace("/login");
    }, [loading, session, router]);

    // Cargar órdenes del backend
    useEffect(() => {
        if (!session) return
        getOrdersByCustomer(session).then(setOrders).catch(() => setOrders([]))
    }, [session])

    // Cargar productos para wishlist
    useEffect(() => {
        if (!session) return
        import('@/lib/api')
            .then(({ getPublicProducts }) => getPublicProducts())
            .then(setProducts)
            .catch(() => setProducts([]))
    }, [session])

    useEffect(() => {
    if (!session) return;
    const userId = getUserId(session);
    if (!userId) return;
    getReviewsByUser(userId)
        .then((data) => setReviewCount(data.length))
        .catch(() => setReviewCount(0));
}, [session]);

    // Cargar direcciones
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
        return () => { cancelled = true; };
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
                        {session.email}
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
                    {tab === "wishlist" && <WishlistTab products={products} />}
                    {tab === "addresses" && <AddressPage />}
                    {tab === "reviews" && <ReviewsTab onCountChange={setReviewCount} />}
                </div>
            </div>
        </div>
    );
}
