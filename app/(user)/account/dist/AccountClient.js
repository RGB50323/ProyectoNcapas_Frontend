"use client";
"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
exports.__esModule = true;
var react_1 = require("react");
var link_1 = require("next/link");
var navigation_1 = require("next/navigation");
var auth_1 = require("@/lib/auth");
var wishlist_1 = require("@/lib/wishlist");
var api_1 = require("@/lib/api");
var datetime_1 = require("@/lib/datetime");
var ProductCard_1 = require("@/components/ProductCard");
var ui_1 = require("@/components/ui");
var PageLoader_1 = require("@/components/PageLoader");
var Modal_1 = require("@/components/Modal");
var AddressPage_1 = require("./addresses/AddressPage");
var ReviewsTab_1 = require("./reviews/ReviewsTab");
var useToast_1 = require("@/hooks/useToast");
var TABS = [
    ["orders", "Mis pedidos", null],
    ["wishlist", "Lista de deseos", null],
    ["addresses", "Direcciones", null],
    ["reviews", "Mis reviews", null],
    ["alerts", "Alertas de stock", null],
];
var SHIPPING_STEPS = [
    { k: "PENDING", l: "Pedido realizado" },
    { k: "CONFIRMED", l: "Pago verificado" },
    { k: "PREPARING", l: "Inspeccionado por el Lab" },
    { k: "SHIPPED", l: "Despachado" },
    { k: "DELIVERED", l: "Entregado" },
];
function ShipmentSteps(_a) {
    var status = _a.status;
    if (status === "CANCELLED" || status === "REFUNDED") {
        return (React.createElement("div", { className: "mono", style: { fontSize: 12, letterSpacing: "0.1em", color: "var(--accent-2)", padding: "8px 0" } }, status === "CANCELLED" ? "PEDIDO CANCELADO" : "PEDIDO REEMBOLSADO"));
    }
    var found = SHIPPING_STEPS.findIndex(function (s) { return s.k === status; });
    var idx = found < 0 ? 0 : found;
    var trackPct = idx === 0 ? 0 : (idx / (SHIPPING_STEPS.length - 1)) * 100;
    return (React.createElement("div", null,
        React.createElement("div", { style: { position: "relative", marginBottom: 16 } },
            React.createElement("div", { style: { position: "absolute", top: 13, left: 13, right: 13, height: 1, background: "var(--border)" } }),
            React.createElement("div", { style: { position: "absolute", top: 13, left: 13, height: 1, width: "calc((100% - 26px) * " + trackPct + " / 100)", background: "var(--accent)", transition: "width 0.4s ease" } }),
            React.createElement("div", { style: { display: "flex", justifyContent: "space-between", position: "relative" } }, SHIPPING_STEPS.map(function (s, i) {
                var done = i < idx;
                var active = i === idx;
                return (React.createElement("div", { key: s.k, style: { display: "flex", flexDirection: "column", alignItems: "center", position: "relative" } },
                    React.createElement("div", { style: {
                            width: 26, height: 26,
                            background: done ? "var(--accent)" : active ? "var(--bg-0)" : "var(--bg-1)",
                            border: "1px solid " + (done || active ? "var(--accent)" : "var(--border)"),
                            display: "flex", alignItems: "center", justifyContent: "center",
                            fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: "0.08em",
                            color: done ? "var(--bg-0)" : active ? "var(--accent)" : "var(--text-mute)",
                            position: "relative", zIndex: 1
                        } }, done ? "◆" : "0" + (i + 1))));
            }))),
        React.createElement("div", { style: { display: "grid", gridTemplateColumns: "repeat(" + SHIPPING_STEPS.length + ", 1fr)", gap: 4 } }, SHIPPING_STEPS.map(function (s, i) {
            var done = i <= idx;
            return (React.createElement("div", { key: s.k },
                React.createElement("div", { style: { fontFamily: "var(--font-display)", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.04em", lineHeight: 1.3, color: done ? "var(--text)" : "var(--text-mute)" } }, s.l)));
        }))));
}
function OrderDetail(_a) {
    var order = _a.order, onRefunded = _a.onRefunded;
    var session = auth_1.useAuth().session;
    var show = useToast_1.useToast().show;
    var _b = react_1.useState(false), trackOpen = _b[0], setTrackOpen = _b[1];
    var _c = react_1.useState(null), shipment = _c[0], setShipment = _c[1];
    var _d = react_1.useState(false), trackLoading = _d[0], setTrackLoading = _d[1];
    var _e = react_1.useState(null), trackError = _e[0], setTrackError = _e[1];
    var _f = react_1.useState(false), confirmRefund = _f[0], setConfirmRefund = _f[1];
    var _g = react_1.useState(false), refunding = _g[0], setRefunding = _g[1];
    var _h = react_1.useState([]), items = _h[0], setItems = _h[1];
    var _j = react_1.useState(true), itemsLoading = _j[0], setItemsLoading = _j[1];
    react_1.useEffect(function () {
        if (!session)
            return;
        api_1.getOrderItems(order.id, session)
            .then(setItems)["catch"](function () { return setItems([]); })["finally"](function () { return setItemsLoading(false); });
    }, [order.id, session]);
    function openTracking() {
        return __awaiter(this, void 0, void 0, function () {
            var data, err_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!session)
                            return [2 /*return*/];
                        setTrackOpen(true);
                        setTrackLoading(true);
                        setTrackError(null);
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, 4, 5]);
                        return [4 /*yield*/, api_1.getShipmentTracking(order.id, session)];
                    case 2:
                        data = _a.sent();
                        setShipment(data);
                        return [3 /*break*/, 5];
                    case 3:
                        err_1 = _a.sent();
                        setTrackError(err_1 instanceof Error ? err_1.message : 'No se pudo cargar el envío.');
                        return [3 /*break*/, 5];
                    case 4:
                        setTrackLoading(false);
                        return [7 /*endfinally*/];
                    case 5: return [2 /*return*/];
                }
            });
        });
    }
    function handleRefund() {
        return __awaiter(this, void 0, void 0, function () {
            var e_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!session)
                            return [2 /*return*/];
                        setRefunding(true);
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, 4, 5]);
                        return [4 /*yield*/, api_1.requestRefund(order.id, session)];
                    case 2:
                        _a.sent();
                        show('Devolución procesada. El reembolso se acreditará en 3-5 días hábiles.', 'success');
                        setConfirmRefund(false);
                        onRefunded(order.id);
                        return [3 /*break*/, 5];
                    case 3:
                        e_1 = _a.sent();
                        show(e_1 instanceof Error ? e_1.message : 'Error al procesar la devolución.', 'error');
                        return [3 /*break*/, 5];
                    case 4:
                        setRefunding(false);
                        return [7 /*endfinally*/];
                    case 5: return [2 /*return*/];
                }
            });
        });
    }
    return (React.createElement("div", { style: { padding: 24, background: "var(--bg-1)", borderTop: "1px solid var(--border)" } },
        React.createElement("div", { style: { marginBottom: 32 } },
            React.createElement("div", { className: "display", style: { fontSize: 12, letterSpacing: "0.14em", color: "var(--text-mute)", marginBottom: 20 } },
                "L\u00CDNEA DE ENV\u00CDO \u00B7 ",
                order.tracking),
            React.createElement(ShipmentSteps, { status: order.status })),
        (order.subtotal !== undefined || order.shippingMethodName) && (React.createElement("div", { style: { marginBottom: 24, paddingBottom: 24, borderBottom: "1px solid var(--border)" } },
            order.shippingAddressStreet && (React.createElement("div", { style: { marginBottom: 8 } },
                React.createElement("span", { className: "mono mute" }, "DIRECCI\u00D3N: "),
                order.shippingAddressStreet,
                ", ",
                order.shippingAddressCity,
                ", ",
                order.shippingAddressCountry)),
            order.shippingMethodName && (React.createElement("div", { style: { marginBottom: 8 } },
                React.createElement("span", { className: "mono mute" }, "ENV\u00CDO: "),
                order.shippingMethodName)),
            order.couponCode && (React.createElement("div", { style: { marginBottom: 8 } },
                React.createElement("span", { className: "mono mute" }, "CUP\u00D3N: "),
                order.couponCode)),
            order.subtotal !== undefined && (React.createElement("div", { style: { marginTop: 12 } },
                React.createElement("div", { style: { display: "flex", justifyContent: "space-between" } },
                    React.createElement("span", { className: "mono mute" }, "Subtotal"),
                    React.createElement("span", null,
                        "$",
                        order.subtotal)),
                order.shippingCost !== undefined && (React.createElement("div", { style: { display: "flex", justifyContent: "space-between" } },
                    React.createElement("span", { className: "mono mute" }, "Env\u00EDo"),
                    React.createElement("span", null,
                        "$",
                        order.shippingCost))),
                order.discountAmount !== undefined && order.discountAmount > 0 && (React.createElement("div", { style: { display: "flex", justifyContent: "space-between", color: "var(--accent-2)" } },
                    React.createElement("span", { className: "mono" }, "Descuento"),
                    React.createElement("span", null,
                        "-$",
                        order.discountAmount))),
                React.createElement("div", { style: { display: "flex", justifyContent: "space-between", marginTop: 8, fontWeight: 700 } },
                    React.createElement("span", { className: "display", style: { fontSize: 14 } }, "TOTAL"),
                    React.createElement("span", { className: "display", style: { fontSize: 18 } },
                        "$",
                        order.total)))))),
        React.createElement("div", { style: { marginBottom: 24 } },
            React.createElement("div", { className: "mono mute", style: { fontSize: 11, marginBottom: 12 } }, "PRODUCTOS PEDIDOS"),
            itemsLoading ? (React.createElement("div", { className: "mono mute", style: { fontSize: 13 } }, "Cargando...")) : items.length === 0 ? (React.createElement("div", { className: "mono mute", style: { fontSize: 13 } }, "Sin items.")) : (React.createElement("div", { style: { display: 'flex', flexDirection: 'column', gap: 8 } }, items.map(function (item) { return (React.createElement("div", { key: item.id, style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--border)' } },
                React.createElement("div", null,
                    React.createElement("div", { style: { fontSize: 13, fontFamily: 'var(--font-display)' } }, item.productName),
                    (item.variantSize || item.variantColorName) && (React.createElement("div", { className: "mono mute", style: { fontSize: 11, marginTop: 3 } }, [item.variantSize, item.variantColorName].filter(Boolean).join(' · ')))),
                React.createElement("div", { style: { textAlign: 'right' } },
                    React.createElement("div", { className: "mono mute", style: { fontSize: 11 } },
                        "x",
                        item.quantity),
                    React.createElement("div", { className: "display", style: { fontSize: 14 } },
                        "$",
                        item.totalPrice)))); })))),
        React.createElement("div", { style: { display: 'flex', gap: 8, flexWrap: 'wrap', flexShrink: 0 } },
            React.createElement("button", { className: "btn btn-ghost", style: { padding: '8px 14px' }, onClick: openTracking }, "Rastrear env\u00EDo"),
            order.status === 'DELIVERED' && (React.createElement("button", { className: "btn btn-outline", style: { padding: '8px 14px' }, onClick: function () { return setConfirmRefund(true); } }, "Solicitar devoluci\u00F3n"))),
        React.createElement(Modal_1["default"], { open: confirmRefund, title: "SOLICITAR DEVOLUCI\u00D3N", onClose: function () { return setConfirmRefund(false); }, width: 460 },
            React.createElement("p", { style: { fontSize: 14, color: 'var(--text-dim)', marginBottom: 8 } },
                "\u00BFConfirm\u00E1s la devoluci\u00F3n del pedido ",
                React.createElement("strong", null, order.id.slice(0, 8).toUpperCase()),
                "?"),
            React.createElement("p", { style: { fontSize: 13, color: 'var(--text-mute)', marginBottom: 24 } },
                "El reembolso de ",
                React.createElement("strong", null,
                    "$",
                    order.total),
                " se acreditar\u00E1 en 3-5 d\u00EDas h\u00E1biles al m\u00E9todo de pago original. El stock ser\u00E1 restituido autom\u00E1ticamente."),
            React.createElement("div", { style: { display: 'flex', gap: 10, justifyContent: 'flex-end' } },
                React.createElement("button", { className: "btn btn-ghost", onClick: function () { return setConfirmRefund(false); } }, "Cancelar"),
                React.createElement("button", { className: "btn", style: { background: 'var(--accent-2)', borderColor: 'var(--accent-2)' }, onClick: handleRefund, disabled: refunding }, refunding ? 'Procesando…' : 'Confirmar devolución'))),
        React.createElement(Modal_1["default"], { open: trackOpen, title: "RASTREO DE ENV\u00CDO", onClose: function () { return setTrackOpen(false); }, width: 560 }, trackLoading ? (React.createElement("div", { className: "mono mute" }, "Cargando env\u00EDo\u2026")) : trackError ? (React.createElement("div", { className: "mono", style: { color: "var(--accent-2, #c0392b)" } }, trackError)) : shipment ? (React.createElement("div", null,
            React.createElement("div", { style: { display: "flex", gap: 32, flexWrap: "wrap", marginBottom: 28 } },
                React.createElement("div", null,
                    React.createElement("div", { className: "mono mute", style: { fontSize: 11 } }, "GU\u00CDA"),
                    React.createElement("div", { style: { fontSize: 13, marginTop: 4 } }, shipment.trackingNumber || "—")),
                React.createElement("div", null,
                    React.createElement("div", { className: "mono mute", style: { fontSize: 11 } }, "ENV\u00CDO"),
                    React.createElement("div", { style: { fontSize: 13, marginTop: 4 } }, shipment.shippingMethod || "—")),
                React.createElement("div", null,
                    React.createElement("div", { className: "mono mute", style: { fontSize: 11 } }, "ENTREGA ESTIMADA"),
                    React.createElement("div", { style: { fontSize: 13, marginTop: 4 } }, datetime_1.formatDateSV(shipment.estimatedDelivery, true)))),
            React.createElement(ShipmentSteps, { status: shipment.orderStatus }))) : null)));
}
function OrdersTab(_a) {
    var initialOrders = _a.orders;
    var _b = react_1.useState(initialOrders), orders = _b[0], setOrders = _b[1];
    var _c = react_1.useState(null), open = _c[0], setOpen = _c[1];
    function handleRefunded(id) {
        setOrders(function (prev) { return prev.map(function (o) { return o.id === id ? __assign(__assign({}, o), { status: 'REFUNDED' }) : o; }); });
    }
    if (orders.length === 0) {
        return (React.createElement("div", null,
            React.createElement("div", { className: "display", style: { fontSize: 24, marginBottom: 24 } }, "PEDIDOS RECIENTES"),
            React.createElement("div", { className: "card", style: { padding: 48, textAlign: "center" } },
                React.createElement("div", { className: "display", style: { fontSize: 20 } }, "A\u00FAn no tienes pedidos."),
                React.createElement(link_1["default"], { href: "/catalog", className: "btn", style: { marginTop: 16 } }, "Explorar el cat\u00E1logo"))));
    }
    return (React.createElement("div", null,
        React.createElement("div", { className: "display", style: { fontSize: 24, marginBottom: 24 } }, "PEDIDOS RECIENTES"),
        orders.map(function (o) { return (React.createElement("div", { key: o.id, className: "card", style: { padding: 0, marginBottom: 16, overflow: "hidden" } },
            React.createElement("div", { onClick: function () { return setOpen(open === o.id ? null : o.id); }, style: { padding: 20, display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr auto", gap: 16, alignItems: "center", cursor: "pointer" } },
                React.createElement("div", null,
                    React.createElement("div", { className: "mono mute" }, "PEDIDO"),
                    React.createElement("div", { className: "display", style: { fontSize: 14, marginTop: 4 } }, o.id.slice(0, 8).toUpperCase())),
                React.createElement("div", null,
                    React.createElement("div", { className: "mono mute" }, "FECHA"),
                    React.createElement("div", { style: { marginTop: 4, fontSize: 13 } }, o.date)),
                React.createElement("div", null,
                    React.createElement("div", { className: "mono mute" }, "ESTADO"),
                    React.createElement("div", { style: { marginTop: 4 } },
                        React.createElement(ui_1.StatusPill, { status: o.status }))),
                React.createElement("div", null,
                    React.createElement("div", { className: "mono mute" }, "TOTAL"),
                    React.createElement("div", { className: "display", style: { fontSize: 16, marginTop: 4 } },
                        "$",
                        o.total)),
                React.createElement("button", { className: "btn btn-ghost", style: { padding: "8px 14px" } }, open === o.id ? "Cerrar" : "Detalles")),
            open === o.id && React.createElement(OrderDetail, { order: o, onRefunded: handleRefunded }))); })));
}
function WishlistTab(_a) {
    var products = _a.products;
    var items = wishlist_1.useWishlist().items;
    var wished = products.filter(function (p) { return items.some(function (w) { return w.productId === p.id; }); });
    return (React.createElement("div", null,
        React.createElement("div", { className: "display", style: { fontSize: 24, marginBottom: 24 } },
            "LISTA DE DESEOS \u00B7 ",
            wished.length,
            " PIEZAS"),
        wished.length === 0 ? (React.createElement("div", { className: "card", style: { padding: 48, textAlign: "center" } },
            React.createElement("div", { className: "display", style: { fontSize: 20 } }, "A\u00FAn no tienes favoritos."),
            React.createElement(link_1["default"], { href: "/catalog", className: "btn", style: { marginTop: 16 } }, "Explorar el cat\u00E1logo"))) : (React.createElement("div", { className: "grid-products" }, wished.map(function (p) { return React.createElement(ProductCard_1["default"], { key: p.id, p: p }); })))));
}
// ─── Pestaña de alertas de stock ──────────────────────────────
function AlertsTab() {
    var session = auth_1.useAuth().session;
    var _a = react_1.useState([]), alerts = _a[0], setAlerts = _a[1];
    var _b = react_1.useState(true), loading = _b[0], setLoading = _b[1];
    react_1.useEffect(function () {
        if (!session)
            return;
        api_1.getMyStockAlerts(session)
            .then(setAlerts)["catch"](function () { return setAlerts([]); })["finally"](function () { return setLoading(false); });
    }, [session]);
    function handleDelete(id) {
        return __awaiter(this, void 0, void 0, function () {
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        if (!session)
                            return [2 /*return*/];
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, api_1.deleteStockAlert(id, session)];
                    case 2:
                        _b.sent();
                        setAlerts(function (prev) { return prev.filter(function (a) { return a.id !== id; }); });
                        return [3 /*break*/, 4];
                    case 3:
                        _a = _b.sent();
                        return [3 /*break*/, 4];
                    case 4: return [2 /*return*/];
                }
            });
        });
    }
    if (loading)
        return React.createElement("div", { className: "mono mute" }, "Cargando alertas...");
    return (React.createElement("div", null,
        React.createElement("div", { className: "display", style: { fontSize: 24, marginBottom: 24 } },
            "ALERTAS DE STOCK \u00B7 ",
            alerts.length),
        alerts.length === 0 ? (React.createElement("div", { className: "card", style: { padding: 48, textAlign: "center" } },
            React.createElement("div", { className: "display", style: { fontSize: 20 } }, "No tienes alertas activas."),
            React.createElement("p", { className: "mute", style: { marginTop: 8, fontSize: 13 } }, "Cuando un producto est\u00E9 agotado, puedes activar una alerta desde su p\u00E1gina."),
            React.createElement(link_1["default"], { href: "/catalog", className: "btn", style: { marginTop: 16 } }, "Explorar el cat\u00E1logo"))) : (React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 12 } }, alerts.map(function (a) { return (React.createElement("div", { key: a.id, className: "card", style: { padding: 20, display: "flex", justifyContent: "space-between", alignItems: "center" } },
            React.createElement("div", null,
                React.createElement("div", { style: { fontFamily: "var(--font-display)", fontSize: 14 } }, a.productName),
                React.createElement("div", { className: "mono mute", style: { marginTop: 4, fontSize: 11 } },
                    "Alerta creada \u00B7 ",
                    datetime_1.formatDateSV(a.notifiedAt))),
            React.createElement("button", { className: "btn btn-ghost", style: { padding: "8px 14px" }, onClick: function () { return handleDelete(a.id); } }, "Cancelar alerta"))); })))));
}
// ─── Componente principal ─────────────────────────────────────
function AccountClient() {
    var _this = this;
    var _a;
    var searchParams = navigation_1.useSearchParams();
    var requestedTab = (_a = searchParams.get("tab")) !== null && _a !== void 0 ? _a : "";
    var _b = react_1.useState(["orders", "wishlist", "addresses", "reviews", "alerts"].includes(requestedTab)
        ? requestedTab : "orders"), tab = _b[0], setTab = _b[1];
    var _c = react_1.useState([]), orders = _c[0], setOrders = _c[1];
    var _d = react_1.useState(true), ordersLoading = _d[0], setOrdersLoading = _d[1];
    var _e = react_1.useState([]), products = _e[0], setProducts = _e[1];
    var _f = react_1.useState([]), addresses = _f[0], setAddresses = _f[1];
    var _g = react_1.useState(0), addressCount = _g[0], setAddressCount = _g[1];
    var _h = react_1.useState(0), alertCount = _h[0], setAlertCount = _h[1];
    var router = navigation_1.useRouter();
    var _j = auth_1.useAuth(), session = _j.session, loading = _j.loading, logout = _j.logout;
    var wishCount = wishlist_1.useWishlist().count;
    var _k = react_1.useState(0), reviewCount = _k[0], setReviewCount = _k[1];
    var ToastContainer = useToast_1.useToast().ToastContainer;
    var tabsWithCounts = TABS.map(function (_a) {
        var k = _a[0], label = _a[1], count = _a[2];
        if (k === "addresses")
            return [k, label, String(addressCount)];
        if (k === "wishlist")
            return [k, label, String(wishCount)];
        if (k === "orders")
            return [k, label, String(orders.length)];
        if (k === "reviews")
            return [k, label, String(reviewCount)];
        if (k === "alerts")
            return [k, label, alertCount > 0 ? String(alertCount) : ""];
        return [k, label, count !== null && count !== void 0 ? count : ""];
    });
    react_1.useEffect(function () {
        if (!loading && !session)
            router.replace("/login");
    }, [loading, session, router]);
    react_1.useEffect(function () {
        if (!session)
            return;
        setOrdersLoading(true);
        api_1.getOrdersByCustomer(session)
            .then(setOrders)["catch"](function () { return setOrders([]); })["finally"](function () { return setOrdersLoading(false); });
    }, [session]);
    react_1.useEffect(function () {
        if (!session)
            return;
        Promise.resolve().then(function () { return require('@/lib/api'); }).then(function (_a) {
            var getPublicProducts = _a.getPublicProducts;
            return getPublicProducts();
        })
            .then(setProducts)["catch"](function () { return setProducts([]); });
    }, [session]);
    react_1.useEffect(function () {
        if (!session)
            return;
        var userId = auth_1.getUserId(session);
        if (!userId)
            return;
        api_1.getReviewsByUser(userId)
            .then(function (data) { return setReviewCount(data.length); })["catch"](function () { return setReviewCount(0); });
    }, [session]);
    react_1.useEffect(function () {
        if (!session)
            return;
        api_1.getMyStockAlerts(session)
            .then(function (data) { return setAlertCount(data.length); })["catch"](function () { return setAlertCount(0); });
    }, [session]);
    react_1.useEffect(function () {
        if (!session)
            return;
        var cancelled = false;
        var load = function () { return __awaiter(_this, void 0, void 0, function () {
            var userId, res, json, data;
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        userId = auth_1.getUserId(session);
                        if (!userId)
                            return [2 /*return*/];
                        return [4 /*yield*/, auth_1.authFetch("/addresses/user/" + userId, session)];
                    case 1:
                        res = _b.sent();
                        return [4 /*yield*/, res.json()];
                    case 2:
                        json = _b.sent();
                        data = (_a = json === null || json === void 0 ? void 0 : json.data) !== null && _a !== void 0 ? _a : [];
                        if (!cancelled) {
                            setAddresses(data);
                            setAddressCount(data.length);
                        }
                        return [2 /*return*/];
                }
            });
        }); };
        load();
        return function () { cancelled = true; };
    }, [session]);
    if (loading || !session)
        return React.createElement(PageLoader_1.PageLoader, null);
    return (React.createElement("div", { className: "container page" },
        React.createElement("div", { className: "crumbs" },
            React.createElement(link_1["default"], { href: "/" }, "Inicio"),
            React.createElement("span", { className: "sep" }, "/"),
            React.createElement("em", null, "Cuenta")),
        React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "end", marginBottom: 48, paddingBottom: 24, borderBottom: "1px solid var(--border)" } },
            React.createElement("div", null,
                React.createElement("h1", { className: "display", style: { fontSize: 56, marginTop: 12 } },
                    "HOLA, ",
                    session.firstName.toUpperCase(),
                    "."),
                React.createElement("p", { className: "mute", style: { marginTop: 8, fontSize: 14 } }, session.email)),
            React.createElement("div", { style: { display: "flex", gap: 12 } },
                React.createElement("button", { className: "btn btn-outline", onClick: function () { return router.push("/account/profile"); } }, "Ver perfil"),
                React.createElement("button", { className: "btn btn-ghost", onClick: function () { return __awaiter(_this, void 0, void 0, function () { return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0: return [4 /*yield*/, logout()];
                            case 1:
                                _a.sent();
                                router.replace("/");
                                return [2 /*return*/];
                        }
                    }); }); } }, "Cerrar sesi\u00F3n"))),
        React.createElement("div", { style: { display: "grid", gridTemplateColumns: "220px 1fr", gap: 48 } },
            React.createElement("nav", { style: { display: "flex", flexDirection: "column", gap: 4 } }, tabsWithCounts.map(function (_a) {
                var k = _a[0], l = _a[1], c = _a[2];
                return (React.createElement("button", { key: k, onClick: function () { return k === "security" ? router.push("/account/security") : setTab(k); }, style: {
                        display: "flex", justifyContent: "space-between", alignItems: "center",
                        padding: "12px 14px", borderRadius: 4,
                        background: tab === k ? "var(--card)" : "transparent",
                        borderTop: "none", borderRight: "none", borderBottom: "none",
                        borderLeft: "2px solid " + (tab === k ? "var(--accent)" : "transparent"),
                        color: tab === k ? "var(--text)" : "var(--text-dim)",
                        fontSize: 13, cursor: "pointer", textAlign: "left", paddingLeft: 12
                    } },
                    React.createElement("span", null, l),
                    c && React.createElement("span", { className: "mono mute", style: { fontSize: 11 } }, c)));
            })),
            React.createElement("div", null,
                tab === "orders" && (ordersLoading ? React.createElement("div", { className: "mono mute" }, "Cargando pedidos...") : React.createElement(OrdersTab, { orders: orders })),
                tab === "wishlist" && React.createElement(WishlistTab, { products: products }),
                tab === "addresses" && React.createElement(AddressPage_1["default"], null),
                tab === "reviews" && React.createElement(ReviewsTab_1["default"], { onCountChange: setReviewCount }),
                tab === "alerts" && React.createElement(AlertsTab, null))),
        React.createElement(ToastContainer, null)));
}
exports["default"] = AccountClient;
