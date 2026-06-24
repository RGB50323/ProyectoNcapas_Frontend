"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth, getUserId, authFetch } from "@/lib/auth";
import { useWishlist } from "@/lib/wishlist";
import { getOrdersByCustomer, getReviewsByUser, getMyStockAlerts, deleteStockAlert, getShipmentTracking } from "@/lib/api";
import { formatDateSV } from "@/lib/datetime";
import type { Order, Product, Review, StockAlert, Shipment } from "@/lib/types";
import ProductCard from "@/components/ProductCard";
import { StatusPill } from "@/components/ui";
import { PageLoader } from "@/components/PageLoader";
import Modal from "@/components/Modal";
import AddressPage from "./addresses/AddressPage";
import ReviewsTab from "./reviews/ReviewsTab";

const TABS: [string, string, string | null][] = [
    ["orders", "Mis pedidos", null],
    ["wishlist", "Lista de deseos", null],
    ["addresses", "Direcciones", null],
    ["reviews", "Mis reviews", null],
    ["alerts", "Alertas de stock", null],
];

const SHIPPING_STEPS = [
    { k: "PENDING", l: "Pedido realizado" },
    { k: "CONFIRMED", l: "Pago verificado" },
    { k: "PREPARING", l: "Inspeccionado por el Lab" },
    { k: "SHIPPED", l: "Despachado" },
    { k: "DELIVERED", l: "Entregado" },
];

function ShipmentSteps({ status }: { status: string }) {
    if (status === "CANCELLED" || status === "REFUNDED") {
        return (
            <div className="mono" style={{ fontSize: 12, letterSpacing: "0.1em", color: "var(--accent-2)", padding: "8px 0" }}>
                {status === "CANCELLED" ? "PEDIDO CANCELADO" : "PEDIDO REEMBOLSADO"}
            </div>
        );
    }
    const found = SHIPPING_STEPS.findIndex((s) => s.k === status);
    const idx = found < 0 ? 0 : found;
    const trackPct = idx === 0 ? 0 : (idx / (SHIPPING_STEPS.length - 1)) * 100;
    return (
        <div>
            <div style={{ position: "relative", marginBottom: 16 }}>
                <div style={{ position: "absolute", top: 13, left: 13, right: 13, height: 1, background: "var(--border)" }} />
                <div style={{ position: "absolute", top: 13, left: 13, height: 1, width: `calc((100% - 26px) * ${trackPct} / 100)`, background: "var(--accent)", transition: "width 0.4s ease" }} />
                <div style={{ display: "flex", justifyContent: "space-between", position: "relative" }}>
                    {SHIPPING_STEPS.map((s, i) => {
                        const done = i < idx;
                        const active = i === idx;
                        return (
                            <div key={s.k} style={{ display: "flex", flexDirection: "column", alignItems: "center", position: "relative" }}>
                                <div style={{
                                    width: 26, height: 26,
                                    background: done ? "var(--accent)" : active ? "var(--bg-0)" : "var(--bg-1)",
                                    border: `1px solid ${done || active ? "var(--accent)" : "var(--border)"}`,
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                    fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: "0.08em",
                                    color: done ? "var(--bg-0)" : active ? "var(--accent)" : "var(--text-mute)",
                                    position: "relative", zIndex: 1,
                                }}>
                                    {done ? "◆" : `0${i + 1}`}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: `repeat(${SHIPPING_STEPS.length}, 1fr)`, gap: 4 }}>
                {SHIPPING_STEPS.map((s, i) => {
                    const done = i <= idx;
                    return (
                        <div key={s.k}>
                            <div style={{ fontFamily: "var(--font-display)", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.04em", lineHeight: 1.3, color: done ? "var(--text)" : "var(--text-mute)" }}>
                                {s.l}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

function OrderDetail({ order }: { order: Order }) {
    const { session } = useAuth();
    const [trackOpen, setTrackOpen] = useState(false);
    const [shipment, setShipment] = useState<Shipment | null>(null);
    const [trackLoading, setTrackLoading] = useState(false);
    const [trackError, setTrackError] = useState<string | null>(null);

    async function openTracking() {
        if (!session) return;
        setTrackOpen(true);
        setTrackLoading(true);
        setTrackError(null);
        try {
            const data = await getShipmentTracking(order.id, session);
            setShipment(data);
        } catch (err) {
            setTrackError(err instanceof Error ? err.message : "No se pudo cargar el envío.");
        } finally {
            setTrackLoading(false);
        }
    }

    return (
        <div style={{ padding: 24, background: "var(--bg-1)", borderTop: "1px solid var(--border)" }}>
            <div style={{ marginBottom: 32 }}>
                <div className="display" style={{ fontSize: 12, letterSpacing: "0.14em", color: "var(--text-mute)", marginBottom: 20 }}>
                    LÍNEA DE ENVÍO · {order.tracking}
                </div>
                <ShipmentSteps status={order.status} />
            </div>

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

            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", flexShrink: 0 }}>
                <button className="btn btn-ghost" style={{ padding: "8px 14px" }} onClick={openTracking}>Rastrear envío</button>
                {order.status === "DELIVERED" && (
                    <button className="btn btn-outline" style={{ padding: "8px 14px" }}>Solicitar devolución</button>
                )}
            </div>

            <Modal open={trackOpen} title="RASTREO DE ENVÍO" onClose={() => setTrackOpen(false)} width={560}>
                {trackLoading ? (
                    <div className="mono mute">Cargando envío…</div>
                ) : trackError ? (
                    <div className="mono" style={{ color: "var(--accent-2, #c0392b)" }}>{trackError}</div>
                ) : shipment ? (
                    <div>
                        <div style={{ display: "flex", gap: 32, flexWrap: "wrap", marginBottom: 28 }}>
                            <div>
                                <div className="mono mute" style={{ fontSize: 11 }}>GUÍA</div>
                                <div style={{ fontSize: 13, marginTop: 4 }}>{shipment.trackingNumber || "—"}</div>
                            </div>
                            <div>
                                <div className="mono mute" style={{ fontSize: 11 }}>ENVÍO</div>
                                <div style={{ fontSize: 13, marginTop: 4 }}>{shipment.shippingMethod || "—"}</div>
                            </div>
                            <div>
                                <div className="mono mute" style={{ fontSize: 11 }}>ENTREGA ESTIMADA</div>
                                <div style={{ fontSize: 13, marginTop: 4 }}>{formatDateSV(shipment.estimatedDelivery, true)}</div>
                            </div>
                        </div>
                        <ShipmentSteps status={shipment.orderStatus} />
                    </div>
                ) : null}
            </Modal>
        </div>
    );
}

function OrdersTab({ orders }: { orders: Order[] }) {
    const [open, setOpen] = useState<string | null>(null);
    if (orders.length === 0) {
        return (
            <div>
                <div className="display" style={{ fontSize: 24, marginBottom: 24 }}>PEDIDOS RECIENTES</div>
                <div className="card" style={{ padding: 48, textAlign: "center" }}>
                    <div className="display" style={{ fontSize: 20 }}>Aún no tienes pedidos.</div>
                    <Link href="/catalog" className="btn" style={{ marginTop: 16 }}>Explorar el catálogo</Link>
                </div>
            </div>
        );
    }
    return (
        <div>
            <div className="display" style={{ fontSize: 24, marginBottom: 24 }}>PEDIDOS RECIENTES</div>
            {orders.map((o) => (
                <div key={o.id} className="card" style={{ padding: 0, marginBottom: 16, overflow: "hidden" }}>
                    <div onClick={() => setOpen(open === o.id ? null : o.id)} style={{ padding: 20, display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr auto", gap: 16, alignItems: "center", cursor: "pointer" }}>
                        <div>
                            <div className="mono mute">PEDIDO</div>
                            <div className="display" style={{ fontSize: 14, marginTop: 4 }}>{o.id.slice(0, 8).toUpperCase()}</div>
                        </div>
                        <div>
                            <div className="mono mute">FECHA</div>
                            <div style={{ marginTop: 4, fontSize: 13 }}>{o.date}</div>
                        </div>
                        <div>
                            <div className="mono mute">ESTADO</div>
                            <div style={{ marginTop: 4 }}><StatusPill status={o.status} /></div>
                        </div>
                        <div>
                            <div className="mono mute">TOTAL</div>
                            <div className="display" style={{ fontSize: 16, marginTop: 4 }}>${o.total}</div>
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
            <div className="display" style={{ fontSize: 24, marginBottom: 24 }}>LISTA DE DESEOS · {wished.length} PIEZAS</div>
            {wished.length === 0 ? (
                <div className="card" style={{ padding: 48, textAlign: "center" }}>
                    <div className="display" style={{ fontSize: 20 }}>Aún no tienes favoritos.</div>
                    <Link href="/catalog" className="btn" style={{ marginTop: 16 }}>Explorar el catálogo</Link>
                </div>
            ) : (
                <div className="grid-products">
                    {wished.map((p) => <ProductCard key={p.id} p={p} />)}
                </div>
            )}
        </div>
    );
}

// ─── Pestaña de alertas de stock ──────────────────────────────
function AlertsTab() {
    const { session } = useAuth()
    const [alerts, setAlerts] = useState<StockAlert[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (!session) return
        getMyStockAlerts(session)
            .then(setAlerts)
            .catch(() => setAlerts([]))
            .finally(() => setLoading(false))
    }, [session])

    async function handleDelete(id: string) {
        if (!session) return
        try {
            await deleteStockAlert(id, session)
            setAlerts((prev) => prev.filter((a) => a.id !== id))
        } catch {}
    }

    if (loading) return <div className="mono mute">Cargando alertas...</div>

    return (
        <div>
            <div className="display" style={{ fontSize: 24, marginBottom: 24 }}>
                ALERTAS DE STOCK · {alerts.length}
            </div>
            {alerts.length === 0 ? (
                <div className="card" style={{ padding: 48, textAlign: "center" }}>
                    <div className="display" style={{ fontSize: 20 }}>No tienes alertas activas.</div>
                    <p className="mute" style={{ marginTop: 8, fontSize: 13 }}>
                        Cuando un producto esté agotado, puedes activar una alerta desde su página.
                    </p>
                    <Link href="/catalog" className="btn" style={{ marginTop: 16 }}>Explorar el catálogo</Link>
                </div>
            ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    {alerts.map((a) => (
                        <div key={a.id} className="card" style={{ padding: 20, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <div>
                                <div style={{ fontFamily: "var(--font-display)", fontSize: 14 }}>{a.productName}</div>
                                <div className="mono mute" style={{ marginTop: 4, fontSize: 11 }}>
                                    Alerta creada · {formatDateSV(a.notifiedAt)}
                                </div>
                            </div>
                            <button className="btn btn-ghost" style={{ padding: "8px 14px" }} onClick={() => handleDelete(a.id)}>
                                Cancelar alerta
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}

// ─── Componente principal ─────────────────────────────────────
export default function AccountClient() {
    const searchParams = useSearchParams();
    const requestedTab = searchParams.get("tab") ?? "";
    const [tab, setTab] = useState(
        ["orders", "wishlist", "addresses", "reviews", "alerts"].includes(requestedTab)
            ? requestedTab : "orders",
    );
    const [orders, setOrders] = useState<Order[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [addresses, setAddresses] = useState<any[]>([]);
    const [addressCount, setAddressCount] = useState(0);
    const [alertCount, setAlertCount] = useState(0);
    const router = useRouter();
    const { session, loading, logout } = useAuth();
    const { count: wishCount } = useWishlist();
    const [reviewCount, setReviewCount] = useState(0);

    const tabsWithCounts = TABS.map(([k, label, count]) => {
        if (k === "addresses") return [k, label, String(addressCount)];
        if (k === "wishlist") return [k, label, String(wishCount)];
        if (k === "orders") return [k, label, String(orders.length)];
        if (k === "reviews") return [k, label, String(reviewCount)];
        if (k === "alerts") return [k, label, alertCount > 0 ? String(alertCount) : ""];
        return [k, label, count ?? ""];
    });

    useEffect(() => {
        if (!loading && !session) router.replace("/login");
    }, [loading, session, router]);

    useEffect(() => {
        if (!session) return
        getOrdersByCustomer(session).then(setOrders).catch(() => setOrders([]))
    }, [session])

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

    useEffect(() => {
        if (!session) return
        getMyStockAlerts(session)
            .then((data) => setAlertCount(data.length))
            .catch(() => setAlertCount(0))
    }, [session])

    useEffect(() => {
        if (!session) return;
        let cancelled = false;
        const load = async () => {
            const userId = getUserId(session);
            if (!userId) return;
            const res = await authFetch(`/addresses/user/${userId}`, session);
            const json = await res.json();
            const data = json?.data ?? [];
            if (!cancelled) { setAddresses(data); setAddressCount(data.length); }
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
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "end", marginBottom: 48, paddingBottom: 24, borderBottom: "1px solid var(--border)" }}>
                <div>
                    <h1 className="display" style={{ fontSize: 56, marginTop: 12 }}>
                        HOLA, {session.firstName.toUpperCase()}.
                    </h1>
                    <p className="mute" style={{ marginTop: 8, fontSize: 14 }}>{session.email}</p>
                </div>
                <div style={{ display: "flex", gap: 12 }}>
                    <button className="btn btn-outline" onClick={() => router.push("/account/profile")}>Ver perfil</button>
                    <button className="btn btn-ghost" onClick={async () => { await logout(); router.replace("/"); }}>Cerrar sesión</button>
                </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "220px 1fr", gap: 48 }}>
                <nav style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    {tabsWithCounts.map(([k, l, c]) => (
                        <button
                            key={k}
                            onClick={() => k === "security" ? router.push("/account/security") : setTab(k)}
                            style={{
                                display: "flex", justifyContent: "space-between", alignItems: "center",
                                padding: "12px 14px", borderRadius: 4,
                                background: tab === k ? "var(--card)" : "transparent",
                                borderTop: "none", borderRight: "none", borderBottom: "none",
                                borderLeft: "2px solid " + (tab === k ? "var(--accent)" : "transparent"),
                                color: tab === k ? "var(--text)" : "var(--text-dim)",
                                fontSize: 13, cursor: "pointer", textAlign: "left", paddingLeft: 12,
                            }}
                        >
                            <span>{l}</span>
                            {c && <span className="mono mute" style={{ fontSize: 11 }}>{c}</span>}
                        </button>
                    ))}
                </nav>

                <div>
                    {tab === "orders" && <OrdersTab orders={orders} />}
                    {tab === "wishlist" && <WishlistTab products={products} />}
                    {tab === "addresses" && <AddressPage />}
                    {tab === "reviews" && <ReviewsTab onCountChange={setReviewCount} />}
                    {tab === "alerts" && <AlertsTab />}
                </div>
            </div>
        </div>
    );
}
