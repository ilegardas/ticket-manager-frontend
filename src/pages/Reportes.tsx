import { useState } from "react";
import {
  useGetReporteResumen, useGetReportePorSistema, useGetReportePorEstado,
  useGetReportePorPrioridad, useGetReporteSla, useGetReporteTendencias, useGetReportePorRegion,
  getGetReporteResumenQueryKey, getGetReportePorSistemaQueryKey, getGetReportePorEstadoQueryKey,
  getGetReportePorPrioridadQueryKey, getGetReporteSlaQueryKey, getGetReporteTendenciasQueryKey, getGetReportePorRegionQueryKey,
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { CheckCircle2, Clock, AlertTriangle, TrendingUp } from "lucide-react";
import ReporteTickets from "./ReporteTickets";

const COLORS = ["#2563AB", "#3B82F6", "#60A5FA", "#93C5FD", "#BFDBFE", "#DBEAFE"];

export default function Reportes() {
  const [periodo, setPeriodo] = useState<"semana" | "mes" | "trimestre">("mes");

  const { data: resumen, isLoading } = useGetReporteResumen({ query: { queryKey: getGetReporteResumenQueryKey() } });
  const { data: porSistema } = useGetReportePorSistema({ query: { queryKey: getGetReportePorSistemaQueryKey() } });
  const { data: porEstado } = useGetReportePorEstado({ query: { queryKey: getGetReportePorEstadoQueryKey() } });
  const { data: porPrioridad } = useGetReportePorPrioridad({ query: { queryKey: getGetReportePorPrioridadQueryKey() } });
  const { data: sla } = useGetReporteSla({ query: { queryKey: getGetReporteSlaQueryKey() } });
  const { data: tendencias } = useGetReporteTendencias({ periodo }, {
    query: { queryKey: getGetReporteTendenciasQueryKey({ periodo }) },
  });
  const { data: porRegion } = useGetReportePorRegion({ query: { queryKey: getGetReportePorRegionQueryKey() } });

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Reportes y Analíticas</h1>
          <p className="text-sm text-muted-foreground">Métricas globales del sistema de tickets</p>
        </div>
      </div>

      {/* SLA Summary row */}
      {isLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-lg" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-2 mb-1">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <p className="text-xs text-muted-foreground">SLA Cumplido</p>
              </div>
              <p className="text-2xl font-bold">{resumen?.porcentaje_sla_cumplido?.toFixed(1) ?? 0}%</p>
              <Progress value={resumen?.porcentaje_sla_cumplido ?? 0} className="mt-2 h-1.5" />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-2 mb-1">
                <Clock className="h-4 w-4 text-blue-500" />
                <p className="text-xs text-muted-foreground">Prom. Resolución</p>
              </div>
              <p className="text-2xl font-bold">{resumen?.promedio_resolucion_horas?.toFixed(1) ?? 0}h</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-2 mb-1">
                <AlertTriangle className="h-4 w-4 text-red-500" />
                <p className="text-xs text-muted-foreground">Tickets Vencidos</p>
              </div>
              <p className="text-2xl font-bold text-red-500">{resumen?.vencidos ?? 0}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="h-4 w-4 text-primary" />
                <p className="text-xs text-muted-foreground">Esta Semana</p>
              </div>
              <p className="text-2xl font-bold">{resumen?.tickets_semana ?? 0}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{resumen?.tickets_hoy ?? 0} hoy</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Trend chart */}
      <Card>
        <CardHeader className="pb-2 flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-medium">Volumen de Tickets</CardTitle>
          <Select value={periodo} onValueChange={(v) => setPeriodo(v as typeof periodo)}>
            <SelectTrigger className="h-7 text-xs w-32" data-testid="select-periodo"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="semana">Última semana</SelectItem>
              <SelectItem value="mes">Último mes</SelectItem>
              <SelectItem value="trimestre">Último trimestre</SelectItem>
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={220}>
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Por sistema */}
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Por Sistema</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={(porSistema ?? []).slice(0, 8)} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" tick={{ fontSize: 10 }} />
                <YAxis dataKey="nombre" type="category" tick={{ fontSize: 10 }} width={110} />
                <Tooltip contentStyle={{ fontSize: 12 }} />
                <Bar dataKey="total" fill="#2563AB" radius={[0, 3, 3, 0]} name="Tickets" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Por estado */}
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Por Estado</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={porEstado ?? []} dataKey="total" nameKey="nombre" cx="50%" cy="50%" outerRadius={80}>
                  {(porEstado ?? []).map((entry, i) => (
                    <Cell key={i} fill={entry.color ?? COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Por prioridad */}
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Por Prioridad</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={porPrioridad ?? []}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="nombre" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} width={28} />
                <Tooltip contentStyle={{ fontSize: 12 }} />
                <Bar dataKey="total" radius={[3, 3, 0, 0]} name="Tickets">
                  {(porPrioridad ?? []).map((entry, i) => (
                    <Cell key={i} fill={entry.color ?? COLORS[i % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* SLA por prioridad */}
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">SLA por Prioridad</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {sla?.por_prioridad?.map((item) => (
              <div key={item.prioridad} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="font-medium">{item.prioridad}</span>
                  <span className="text-muted-foreground">{item.cumplimiento_porcentaje.toFixed(0)}% · prom. {item.promedio_horas.toFixed(1)}h</span>
                </div>
                <Progress value={item.cumplimiento_porcentaje} className="h-1.5" />
              </div>
            )) ?? (
              <p className="text-xs text-muted-foreground text-center py-4">Sin datos de SLA</p>
            )}
          </CardContent>
        </Card>

        {/* Por región */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Por Región</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={(porRegion ?? []).slice(0, 10)} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" tick={{ fontSize: 10 }} />
                <YAxis dataKey="nombre" type="category" tick={{ fontSize: 10 }} width={120} />
                <Tooltip contentStyle={{ fontSize: 12 }} />
                <Bar dataKey="total" fill="#3B82F6" radius={[0, 3, 3, 0]} name="Tickets" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <ReporteTickets />
    </div>
  );
}
