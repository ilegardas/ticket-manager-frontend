import { useMemo, useState } from "react";
import {
  useGetReporteTickets, getGetReporteTicketsQueryKey,
  useListUsuarios, getListUsuariosQueryKey,
  useListSistemas, getListSistemasQueryKey,
  useListModulos, getListModulosQueryKey,
  useListEstados, getListEstadosQueryKey,
  useListPrioridades, getListPrioridadesQueryKey,
  useListCategorias, getListCategoriasQueryKey,
  type GetReporteTicketsParams,
} from "@workspace/api-client-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { FileDown, RotateCcw } from "lucide-react";

const IMPACTO_LABEL: Record<string, string> = {
  caido_total: "Caído Total",
  parcial: "Parcialmente Funcional / Degradado",
  funcional: "Funcional",
  mejora: "Requerimiento de Mejora",
};

const TODOS = "todos";

type FilterKey =
  | "usuario_asignado" | "estado" | "prioridad" | "impacto" | "categoria"
  | "sistema" | "modulo" | "region" | "puesto" | "cct" | "nivel_educativo";

const EMPTY_FILTERS: Record<FilterKey, string> = {
  usuario_asignado: TODOS, estado: TODOS, prioridad: TODOS, impacto: TODOS,
  categoria: TODOS, sistema: TODOS, modulo: TODOS, region: TODOS, puesto: TODOS,
  cct: TODOS, nivel_educativo: TODOS,
};

function formatDate(value: string | null | undefined) {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleDateString("es-MX", {
      day: "2-digit", month: "2-digit", year: "numeric",
    });
  } catch {
    return "—";
  }
}

function FilterSelect({
  label, value, onChange, options, placeholder = "Todos",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
}) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-medium text-muted-foreground">{label}</label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="h-8 text-xs" data-testid={`filter-${label}`}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={TODOS}>Todos</SelectItem>
          {options.map((o) => (
            <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

export default function ReporteTickets() {
  const [filters, setFilters] = useState<Record<FilterKey, string>>(EMPTY_FILTERS);
  const set = (key: FilterKey, value: string) =>
    setFilters((prev) => {
      const next = { ...prev, [key]: value };
      if (key === "sistema") next.modulo = TODOS;
      return next;
    });
  const reset = () => setFilters(EMPTY_FILTERS);

  const { data: usuarios } = useListUsuarios(undefined, { query: { queryKey: getListUsuariosQueryKey() } });
  const { data: sistemas } = useListSistemas({ query: { queryKey: getListSistemasQueryKey() } });
  const { data: modulos } = useListModulos(undefined, { query: { queryKey: getListModulosQueryKey() } });
  const { data: estados } = useListEstados({ query: { queryKey: getListEstadosQueryKey() } });
  const { data: prioridades } = useListPrioridades({ query: { queryKey: getListPrioridadesQueryKey() } });
  const { data: categorias } = useListCategorias({ query: { queryKey: getListCategoriasQueryKey() } });

  const params = useMemo<GetReporteTicketsParams>(() => {
    const p: GetReporteTicketsParams = {};
    if (filters.usuario_asignado !== TODOS) p.usuario_asignado = Number(filters.usuario_asignado);
    if (filters.estado !== TODOS) p.estado = Number(filters.estado);
    if (filters.prioridad !== TODOS) p.prioridad = Number(filters.prioridad);
    if (filters.categoria !== TODOS) p.categoria = Number(filters.categoria);
    if (filters.sistema !== TODOS) p.sistema = Number(filters.sistema);
    if (filters.modulo !== TODOS) p.modulo = Number(filters.modulo);
    if (filters.impacto !== TODOS) p.impacto = filters.impacto;
    if (filters.region !== TODOS) p.region = filters.region;
    if (filters.puesto !== TODOS) p.puesto = filters.puesto;
    if (filters.cct !== TODOS) p.cct = filters.cct;
    if (filters.nivel_educativo !== TODOS) p.nivel_educativo = filters.nivel_educativo;
    return p;
  }, [filters]);

  const { data: tickets, isFetching } = useGetReporteTickets(params, {
    query: { queryKey: getGetReporteTicketsQueryKey(params) },
  });

  const rows = tickets ?? [];

  // Filter options derived from data
  const asignableUsers = (usuarios ?? []).filter((u) => u.rol === "tecnico" || u.rol === "admin");
  const modulosOfSistema = filters.sistema === TODOS
    ? (modulos ?? [])
    : (modulos ?? []).filter((m) => String(m.sistema_id) === filters.sistema);

  const distinct = (key: "region_zona" | "puesto_cargo" | "cct" | "nivel_educativo") =>
    Array.from(new Set((usuarios ?? [])
      .map((u) => u[key])
      .filter((v): v is string => !!v && v.trim() !== "")))
      .sort()
      .map((v) => ({ value: v, label: v }));

  const exportPDF = () => {
    const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
    const now = new Date().toLocaleString("es-MX");

    doc.setFontSize(14);
    doc.text("Reporte de Tickets - SEECH", 40, 40);
    doc.setFontSize(9);
    doc.setTextColor(110);

    const activeFilters: string[] = [];
    const labelMap: Record<FilterKey, string> = {
      usuario_asignado: "Asignado a", estado: "Estado", prioridad: "Prioridad",
      impacto: "Impacto", categoria: "Categoría", sistema: "Sistema", modulo: "Módulo",
      region: "Región", puesto: "Puesto", cct: "CCT", nivel_educativo: "Nivel educativo",
    };
    (Object.keys(filters) as FilterKey[]).forEach((k) => {
      if (filters[k] === TODOS) return;
      let display = filters[k];
      if (k === "usuario_asignado") display = asignableUsers.find((u) => String(u.id) === filters[k])?.nombre_completo ?? filters[k];
      else if (k === "estado") display = (estados ?? []).find((e) => String(e.id) === filters[k])?.nombre ?? filters[k];
      else if (k === "prioridad") display = (prioridades ?? []).find((p) => String(p.id) === filters[k])?.nombre ?? filters[k];
      else if (k === "categoria") display = (categorias ?? []).find((c) => String(c.id) === filters[k])?.nombre ?? filters[k];
      else if (k === "sistema") display = (sistemas ?? []).find((s) => String(s.id) === filters[k])?.nombre ?? filters[k];
      else if (k === "modulo") display = (modulos ?? []).find((m) => String(m.id) === filters[k])?.nombre ?? filters[k];
      else if (k === "impacto") display = IMPACTO_LABEL[filters[k]] ?? filters[k];
      activeFilters.push(`${labelMap[k]}: ${display}`);
    });

    doc.text(`Generado: ${now}`, 40, 56);
    doc.text(
      activeFilters.length ? `Filtros: ${activeFilters.join("  |  ")}` : "Filtros: ninguno (todos los tickets)",
      40, 70, { maxWidth: 760 },
    );
    doc.text(`Total: ${rows.length} tickets`, 40, activeFilters.length > 0 ? 84 : 84);

    autoTable(doc, {
      startY: 96,
      head: [["Folio", "Título", "Estado", "Prioridad", "Sistema / Módulo", "Asignado", "Reportado por", "Creado"]],
      body: rows.map((t) => [
        t.folio,
        t.titulo,
        t.estado_nombre ?? "—",
        t.prioridad_nombre ?? "—",
        [t.sistema_nombre, t.modulo_nombre].filter(Boolean).join(" / ") || "—",
        t.usuario_asignado_nombre ?? "Sin asignar",
        t.usuario_reporta_nombre ?? "—",
        formatDate(t.fecha_creacion),
      ]),
      styles: { fontSize: 7, cellPadding: 3 },
      headStyles: { fillColor: [37, 99, 171], textColor: 255, fontSize: 7.5 },
      alternateRowStyles: { fillColor: [243, 246, 250] },
      columnStyles: { 1: { cellWidth: 160 } },
      margin: { left: 40, right: 40 },
    });

    doc.save(`reporte-tickets-${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  return (
    <Card>
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-sm font-medium">Reporte de Tickets</CardTitle>
          <p className="text-xs text-muted-foreground mt-0.5">
            Filtra los tickets y exporta el resultado a PDF
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="h-8 text-xs" onClick={reset} data-testid="button-reset-filtros">
            <RotateCcw className="h-3.5 w-3.5 mr-1" /> Limpiar
          </Button>
          <Button size="sm" className="h-8 text-xs" onClick={exportPDF} disabled={rows.length === 0} data-testid="button-export-pdf">
            <FileDown className="h-3.5 w-3.5 mr-1" /> Exportar PDF
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          <FilterSelect label="Asignado a" value={filters.usuario_asignado} onChange={(v) => set("usuario_asignado", v)}
            options={asignableUsers.map((u) => ({ value: String(u.id), label: u.nombre_completo }))} />
          <FilterSelect label="Estado" value={filters.estado} onChange={(v) => set("estado", v)}
            options={(estados ?? []).map((e) => ({ value: String(e.id), label: e.nombre }))} />
          <FilterSelect label="Prioridad" value={filters.prioridad} onChange={(v) => set("prioridad", v)}
            options={(prioridades ?? []).map((p) => ({ value: String(p.id), label: p.nombre }))} />
          <FilterSelect label="Impacto" value={filters.impacto} onChange={(v) => set("impacto", v)}
            options={Object.entries(IMPACTO_LABEL).map(([value, label]) => ({ value, label }))} />
          <FilterSelect label="Categoría" value={filters.categoria} onChange={(v) => set("categoria", v)}
            options={(categorias ?? []).map((c) => ({ value: String(c.id), label: c.nombre }))} />
          <FilterSelect label="Sistema" value={filters.sistema} onChange={(v) => set("sistema", v)}
            options={(sistemas ?? []).map((s) => ({ value: String(s.id), label: s.nombre }))} />
          <FilterSelect label="Módulo" value={filters.modulo} onChange={(v) => set("modulo", v)}
            options={modulosOfSistema.map((m) => ({ value: String(m.id), label: m.nombre }))} />
          <FilterSelect label="Usuario / Región" value={filters.region} onChange={(v) => set("region", v)}
            options={distinct("region_zona")} />
          <FilterSelect label="Usuario / Puesto" value={filters.puesto} onChange={(v) => set("puesto", v)}
            options={distinct("puesto_cargo")} />
          <FilterSelect label="Usuario / CCT" value={filters.cct} onChange={(v) => set("cct", v)}
            options={distinct("cct")} />
          <FilterSelect label="Usuario / Nivel educativo" value={filters.nivel_educativo} onChange={(v) => set("nivel_educativo", v)}
            options={distinct("nivel_educativo")} />
        </div>

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{isFetching ? "Cargando..." : `${rows.length} resultado(s)`}</span>
        </div>

        <div className="border rounded-md overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">Folio</TableHead>
                <TableHead className="text-xs">Título</TableHead>
                <TableHead className="text-xs">Estado</TableHead>
                <TableHead className="text-xs">Prioridad</TableHead>
                <TableHead className="text-xs">Sistema / Módulo</TableHead>
                <TableHead className="text-xs">Asignado</TableHead>
                <TableHead className="text-xs">Reportado por</TableHead>
                <TableHead className="text-xs">Creado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-xs text-muted-foreground py-8">
                    No hay tickets que coincidan con los filtros
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((t) => (
                  <TableRow key={t.id} data-testid={`row-ticket-${t.id}`}>
                    <TableCell className="text-xs font-medium">{t.folio}</TableCell>
                    <TableCell className="text-xs max-w-[220px] truncate">{t.titulo}</TableCell>
                    <TableCell className="text-xs">{t.estado_nombre ?? "—"}</TableCell>
                    <TableCell className="text-xs">{t.prioridad_nombre ?? "—"}</TableCell>
                    <TableCell className="text-xs">
                      {[t.sistema_nombre, t.modulo_nombre].filter(Boolean).join(" / ") || "—"}
                    </TableCell>
                    <TableCell className="text-xs">{t.usuario_asignado_nombre ?? "Sin asignar"}</TableCell>
                    <TableCell className="text-xs">{t.usuario_reporta_nombre ?? "—"}</TableCell>
                    <TableCell className="text-xs">{formatDate(t.fecha_creacion)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
