import { Link } from "wouter";
import {
  useGetReporteResumen, useGetActividadReciente,
  useGetReportePorEstado, useGetReportePorSistema, useGetReporteTendencias,
  getGetReporteResumenQueryKey, getGetActividadRecienteQueryKey,
  getGetReportePorEstadoQueryKey, getGetReportePorSistemaQueryKey, getGetReporteTendenciasQueryKey,
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { Ticket, AlertTriangle, CheckCircle2, Clock, TrendingUp, Activity } from "lucide-react";
import { formatDistanceToNow, parseISO } from "date-fns";
import { es } from "date-fns/locale";

const CHART_COLORS = ["#2563AB", "#3B82F6", "#60A5FA", "#93C5FD", "#BFDBFE"];

function KpiCard({ label, value, icon: Icon, sub, color, href }: {
  label: string; value: number | string; icon: typeof Ticket; sub?: string; color?: string; href: string;
}) {
  return (
    <Link href={href}>
      <Card className="cursor-pointer transition-colors hover:bg-muted/40 hover:border-primary/40"
        data-testid={`kpi-card-${label.toLowerCase().replace(/\s+/g, "-")}`}>
        <CardContent className="pt-4 pb-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">{label}</p>
              <p className="text-2xl font-bold mt-0.5" style={color ? { color } : undefined}>{value}</p>
              {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
            </div>
            <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center">
              <Icon className="h-4 w-4 text-muted-foreground" />
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

export default function Dashboard() {
  const { data: resumen, isLoading: loadingResumen } = useGetReporteResumen({
    query: { queryKey: getGetReporteResumenQueryKey() },
  });
  const { data: actividad } = useGetActividadReciente({
    query: { queryKey: getGetActividadRecienteQueryKey() },
  });
  const { data: porEstado } = useGetReportePorEstado({
    query: { queryKey: getGetReportePorEstadoQueryKey() },
  });
  const { data: porSistema } = useGetReportePorSistema({
    query: { queryKey: getGetReportePorSistemaQueryKey() },
  });
  const { data: tendencias } = useGetReporteTendencias(
    { periodo: "mes" },
    { query: { queryKey: getGetReporteTendenciasQueryKey({ periodo: "mes" }) } },
  );

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Vista general del sistema de tickets</p>
      </div>

      {/* KPI Cards */}
      {loadingResumen ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-lg" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          <KpiCard label="Total" value={resumen?.total_tickets ?? 0} icon={Ticket} href="/tickets" />
          <KpiCard label="Abiertos" value={resumen?.abiertos ?? 0} icon={Clock} color="#2563AB" href="/tickets?vista=abiertos" />
          <KpiCard label="En Proceso" value={resumen?.en_proceso ?? 0} icon={Activity} color="#F97316" href="/tickets?vista=en_proceso" />
          <KpiCard label="Resueltos" value={resumen?.resueltos ?? 0} icon={CheckCircle2} color="#10B981" href="/tickets?vista=resueltos" />
          <KpiCard label="Vencidos" value={resumen?.vencidos ?? 0} icon={AlertTriangle} color="#EF4444" href="/tickets?vista=vencidos" />
          <KpiCard label="Hoy" value={resumen?.tickets_hoy ?? 0} icon={TrendingUp} href="/tickets?vista=hoy"
            sub={`SLA ${resumen?.porcentaje_sla_cumplido?.toFixed(0) ?? 0}%`} />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Trend chart */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Tendencia (últimos 30 días)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={tendencias ?? []}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="fecha" tick={{ fontSize: 10 }} tickFormatter={(v) => v.slice(5)} />
                <YAxis tick={{ fontSize: 10 }} width={28} />
                <Tooltip contentStyle={{ fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Line type="monotone" dataKey="total" stroke="#2563AB" strokeWidth={2} dot={false} name="Nuevos" />
                <Line type="monotone" dataKey="resueltos" stroke="#10B981" strokeWidth={2} dot={false} name="Resueltos" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Por estado pie */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Por Estado</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={porEstado ?? []} dataKey="total" nameKey="nombre" cx="50%" cy="50%" outerRadius={70} label={false}>
                  {(porEstado ?? []).map((entry, i) => (
                    <Cell key={i} fill={entry.color ?? CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ fontSize: 12 }} formatter={(v, n) => [v, n]} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Por sistema bar */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Tickets por Sistema</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={(porSistema ?? []).slice(0, 8)} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" tick={{ fontSize: 10 }} />
                <YAxis dataKey="nombre" type="category" tick={{ fontSize: 10 }} width={100} />
                <Tooltip contentStyle={{ fontSize: 12 }} />
                <Bar dataKey="total" fill="#2563AB" radius={[0, 3, 3, 0]} name="Tickets" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Actividad reciente */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Actividad Reciente</CardTitle>
          </CardHeader>
          <CardContent className="space-y-0">
            {(actividad ?? []).slice(0, 6).map((item) => (
              <div key={item.id} className="flex items-start gap-3 py-2.5 border-b last:border-0">
                <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-foreground truncate">{item.descripcion}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    {item.ticket_folio && (
                      <Link href={`/tickets/${item.ticket_id}`}>
                        <span className="text-xs text-primary hover:underline cursor-pointer">{item.ticket_folio}</span>
                      </Link>
                    )}
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(parseISO(item.fecha), { addSuffix: true, locale: es })}
                    </span>
                  </div>
                </div>
              </div>
            ))}
            {!actividad?.length && (
              <p className="text-xs text-muted-foreground text-center py-4">Sin actividad reciente</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
