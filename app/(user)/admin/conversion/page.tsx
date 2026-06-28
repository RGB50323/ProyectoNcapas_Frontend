"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { authFetch } from "@/lib/auth";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import {
  ChartCard,
  Legend,
  Stat,
  tooltipProps,
  axisTick,
  money,
  STATUS_FILL,
  STATUS_ORDER,
} from "@/components/charts";

type ConversionReport = {
  totalSessions: number;
  activeSessions: number;
  convertedSessions: number;
  abandonedSessions: number;
  conversionRate: number;
  abandonRate: number;
  totalRevenue: number;
  averageOrderValue: number;
  ordersByStatus: Record<string, number>;
};

export default function ConversionPage() {
  const { session } = useAuth();
  const [report, setReport] = useState<ConversionReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!session) return;
    authFetch("/analytics/cart-conversion", session)
      .then((r) => r.json())
      .then((json) => setReport(json.data))
      .catch(() => setError("No se pudo cargar el reporte."))
      .finally(() => setLoading(false));
  }, [session]);

  if (loading)
    return (
      <div className="mono mute" style={{ padding: 48 }}>
        Cargando reporte…
      </div>
    );
  if (error)
    return (
      <div className="mono" style={{ padding: 48, color: "var(--danger)" }}>
        {error}
      </div>
    );
  if (!report) return null;

  const conversionData = [
    { name: "Convertidos", value: report.convertedSessions, fill: "var(--ok)" },
    {
      name: "Abandonados",
      value: report.abandonedSessions,
      fill: "var(--danger)",
    },
    { name: "Activos", value: report.activeSessions, fill: "var(--accent)" },
  ];

  const statusData = STATUS_ORDER.filter(
    (s) => report.ordersByStatus[s] !== undefined,
  ).map((s) => ({
    name: s,
    value: report.ordersByStatus[s] ?? 0,
    fill: STATUS_FILL[s] ?? "var(--text-mute)",
  }));

  const hasCartData = report.totalSessions > 0;
  const hasStatusData = statusData.length > 0;

  return (
    <div>
      <div style={{ marginBottom: 32 }}>
        <div className="eyebrow accent">◇ ANALYTICS · CONVERSIÓN</div>
        <h1 className="display" style={{ fontSize: 40, marginTop: 8 }}>
          CONVERSIÓN Y ABANDONO
        </h1>
        <div className="mute" style={{ fontSize: 13, marginTop: 4 }}>
          Análisis del comportamiento del carrito y las órdenes
        </div>
      </div>

      {/* Stats */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 16,
          marginBottom: 32,
        }}
      >
        <Stat
          label="TASA DE CONVERSIÓN"
          value={`${report.conversionRate}%`}
          sub={`${report.convertedSessions} de ${report.totalSessions} sesiones`}
          href="#"
        />
        <Stat
          label="TASA DE ABANDONO"
          value={`${report.abandonRate}%`}
          sub={`${report.abandonedSessions} sesiones abandonadas`}
          href="#"
        />
        <Stat
          label="REVENUE TOTAL"
          value={money(report.totalRevenue)}
          sub="Órdenes entregadas"
          href="#"
        />
        <Stat
          label="TICKET PROMEDIO"
          value={money(report.averageOrderValue)}
          sub="Por orden entregada"
          href="#"
        />
      </div>

      {/* Fila de stats secundarios */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 16,
          marginBottom: 32,
        }}
      >
        <div className="card" style={{ padding: 20 }}>
          <div className="mono mute" style={{ fontSize: 11, marginBottom: 8 }}>
            SESIONES TOTALES
          </div>
          <div className="display" style={{ fontSize: 32 }}>
            {report.totalSessions}
          </div>
        </div>
        <div className="card" style={{ padding: 20 }}>
          <div className="mono mute" style={{ fontSize: 11, marginBottom: 8 }}>
            CARRITOS ACTIVOS
          </div>
          <div
            className="display"
            style={{ fontSize: 32, color: "var(--accent)" }}
          >
            {report.activeSessions}
          </div>
        </div>
        <div className="card" style={{ padding: 20 }}>
          <div className="mono mute" style={{ fontSize: 11, marginBottom: 8 }}>
            SESIONES CONVERTIDAS
          </div>
          <div className="display" style={{ fontSize: 32, color: "var(--ok)" }}>
            {report.convertedSessions}
          </div>
        </div>
      </div>

      {/* Gráficos */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 24,
          marginBottom: 32,
        }}
      >
        <ChartCard title="SESIONES DE CARRITO" empty={!hasCartData}>
          {hasCartData ? (
            <>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={conversionData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    dataKey="value"
                    paddingAngle={2}
                  >
                    {conversionData.map((entry, i) => (
                      <Cell key={i} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip {...tooltipProps} />
                </PieChart>
              </ResponsiveContainer>
              <Legend data={conversionData} />
            </>
          ) : (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                height: 220,
                gap: 12,
              }}
            >
              <div
                className="display"
                style={{ fontSize: 48, color: "var(--text-mute)" }}
              >
                —
              </div>
              <div className="mono mute" style={{ fontSize: 12 }}>
                Sin sesiones registradas aún
              </div>
            </div>
          )}
        </ChartCard>

        <ChartCard title="PEDIDOS POR ESTADO" empty={!hasStatusData}>
          {hasStatusData && (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={statusData} barSize={32}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="var(--border)"
                  vertical={false}
                />
                <XAxis dataKey="name" tick={axisTick} />
                <YAxis tick={axisTick} allowDecimals={false} />
                <Tooltip {...tooltipProps} />
                <Bar dataKey="value" radius={[2, 2, 0, 0]}>
                  {statusData.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </div>

      {/* Tabla detalle de status */}
      {hasStatusData && (
        <div className="card" style={{ padding: 0 }}>
          <div
            style={{
              padding: "16px 20px",
              borderBottom: "1px solid var(--border)",
            }}
          >
            <div className="display" style={{ fontSize: 15 }}>
              DETALLE POR ESTADO
            </div>
          </div>
          <table className="table">
            <thead>
              <tr>
                <th>Estado</th>
                <th>Cantidad</th>
                <th>% del total</th>
              </tr>
            </thead>
            <tbody>
              {statusData.map((s) => {
                const total = statusData.reduce((acc, d) => acc + d.value, 0);
                const pct =
                  total === 0 ? 0 : ((s.value / total) * 100).toFixed(1);
                return (
                  <tr key={s.name}>
                    <td>
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 8,
                        }}
                      >
                        <span
                          style={{
                            width: 8,
                            height: 8,
                            background: s.fill,
                            display: "inline-block",
                            borderRadius: 2,
                          }}
                        />
                        {s.name}
                      </span>
                    </td>
                    <td className="mono">{s.value}</td>
                    <td className="mono mute">{pct}%</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
