import { useState } from "react";
import { Link, useLocation, useSearchParams } from "wouter";
import {
  useListTickets, useRemindTicket, useListEstados, useListPrioridades,
  useListSistemas, useListCategorias,
  getListTicketsQueryKey, getListEstadosQueryKey, getListPrioridadesQueryKey,
  getListSistemasQueryKey, getListCategoriasQueryKey,
} from "@workspace/api-client-react";
import type { ListTicketsVista } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Plus, Search, Bell, ExternalLink, ChevronLeft, ChevronRight, X } from "lucide-react";
import { formatDistanceToNow, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";

const IMPACTO_LABEL: Record<string, string> = {
  caido_total: "Caído Total",
  parcial: "Degradado",
  funcional: "Funcional",
  mejora: "Mejora",
};

const IMPACTO_COLOR: Record<string, string> = {
  caido_total: "text-red-600 border-red-300",
  parcial: "text-amber-600 border-amber-300",
  funcional: "text-green-600 border-green-300",
  mejora: "text-blue-600 border-blue-300",
};

const VISTA_LABEL: Record<string, string> = {
  abiertos: "Abiertos",
  en_proceso: "En Proceso",
  resueltos: "Resueltos",
  cerrados: "Cerrados",
  vencidos: "Vencidos",
  hoy: "De hoy",
};

export default function TicketList() {
  const [, navigate] = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [estado, setEstado] = useState("all");
  const [prioridad, setPrioridad] = useState("all");
  const [sistema, setSistema] = useState("all");
  const [page, setPage] = useState(1);

  const vistaParam = searchParams.get("vista") ?? undefined;
  const vista = vistaParam && VISTA_LABEL[vistaParam] ? (vistaParam as ListTicketsVista) : undefined;

  const clearVista = () => {
    const next = new URLSearchParams(searchParams);
    next.delete("vista");
    setSearchParams(next);
    setPage(1);
  };

  const params = {
    search: search || undefined,
    estado: estado !== "all" ? parseInt(estado) : undefined,
    prioridad: prioridad !== "all" ? parseInt(prioridad) : undefined,
    sistema: sistema !== "all" ? parseInt(sistema) : undefined,
    vista,
    page,
    page_size: 20,
  };

  const { data, isLoading } = useListTickets(params, {
    query: { queryKey: getListTicketsQueryKey(params) },
  });
  const { data: estados } = useListEstados({ query: { queryKey: getListEstadosQueryKey() } });
  const { data: prioridades } = useListPrioridades({ query: { queryKey: getListPrioridadesQueryKey() } });
  const { data: sistemas } = useListSistemas({ query: { queryKey: getListSistemasQueryKey() } });

  const remind = useRemindTicket();

  const handleRemind = (id: number, e: React.MouseEvent) => {
    e.preventDefault();
    remind.mutate({ id }, {
      onSuccess: () => toast({ title: "Recordatorio enviado" }),
      onError: () => toast({ title: "Error al enviar recordatorio", variant: "destructive" }),
    });
  };

  const totalPages = data ? Math.ceil(data.count / 20) : 1;

  return (
    <div className="p-6 space-y-4 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold">Tickets</h1>
            {vista && (
              <Badge variant="secondary" className="gap-1 text-xs" data-testid="badge-vista">
                {VISTA_LABEL[vista]}
                <button onClick={clearVista} className="ml-0.5 hover:text-foreground" data-testid="button-clear-vista" aria-label="Quitar filtro">
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            {data?.count ?? 0} {vista ? `tickets (${VISTA_LABEL[vista].toLowerCase()})` : "tickets en total"}
          </p>
        </div>
        <Button size="sm" onClick={() => navigate("/tickets/nuevo")} data-testid="button-nuevo-ticket">
          <Plus className="h-3.5 w-3.5 mr-1.5" /> Nuevo Ticket
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Buscar folio, título..."
            className="pl-8 h-8 text-sm"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            data-testid="input-search"
          />
        </div>
        <Select value={estado} onValueChange={(v) => { setEstado(v); setPage(1); }}>
          <SelectTrigger className="h-8 text-sm w-36" data-testid="select-estado">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los estados</SelectItem>
            {estados?.map((e) => <SelectItem key={e.id} value={String(e.id)}>{e.nombre}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={prioridad} onValueChange={(v) => { setPrioridad(v); setPage(1); }}>
          <SelectTrigger className="h-8 text-sm w-36" data-testid="select-prioridad">
            <SelectValue placeholder="Prioridad" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            {prioridades?.map((p) => <SelectItem key={p.id} value={String(p.id)}>{p.nombre}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={sistema} onValueChange={(v) => { setSistema(v); setPage(1); }}>
          <SelectTrigger className="h-8 text-sm w-40" data-testid="select-sistema">
            <SelectValue placeholder="Sistema" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            {sistemas?.map((s) => <SelectItem key={s.id} value={String(s.id)}>{s.nombre}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="rounded-lg border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-28 text-xs">Folio</TableHead>
              <TableHead className="text-xs">Título</TableHead>
              <TableHead className="w-28 text-xs">Sistema</TableHead>
              <TableHead className="w-24 text-xs">Prioridad</TableHead>
              <TableHead className="w-32 text-xs">Estado</TableHead>
              <TableHead className="w-32 text-xs">Impacto</TableHead>
              <TableHead className="w-28 text-xs">Asignado</TableHead>
              <TableHead className="w-28 text-xs">Creado</TableHead>
              <TableHead className="w-16 text-xs"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 9 }).map((_, j) => (
                    <TableCell key={j}><Skeleton className="h-4 rounded" /></TableCell>
                  ))}
                </TableRow>
              ))
            ) : data?.results.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center text-sm text-muted-foreground py-12">
                  No se encontraron tickets
                </TableCell>
              </TableRow>
            ) : (
              data?.results.map((ticket) => (
                <TableRow key={ticket.id} className="hover:bg-muted/30 cursor-pointer"
                  data-testid={`row-ticket-${ticket.id}`}
                  onClick={() => navigate(`/tickets/${ticket.id}`)}>
                  <TableCell className="text-xs font-mono text-primary">{ticket.folio}</TableCell>
                  <TableCell>
                    <p className="text-sm font-medium truncate max-w-xs">{ticket.titulo}</p>
                    {ticket.sistema_nombre && (
                      <p className="text-xs text-muted-foreground">{ticket.modulo_nombre ?? ticket.sistema_nombre}</p>
                    )}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">{ticket.sistema_nombre ?? "—"}</TableCell>
                  <TableCell>
                    {ticket.prioridad_nombre ? (
                      <Badge variant="outline" className="text-xs" style={{ borderColor: ticket.prioridad_color ?? undefined, color: ticket.prioridad_color ?? undefined }}>
                        {ticket.prioridad_nombre}
                      </Badge>
                    ) : "—"}
                  </TableCell>
                  <TableCell>
                    {ticket.estado_nombre ? (
                      <Badge variant="outline" className="text-xs" style={{ borderColor: ticket.estado_color ?? undefined, color: ticket.estado_color ?? undefined }}>
                        {ticket.estado_nombre}
                      </Badge>
                    ) : "—"}
                  </TableCell>
                  <TableCell>
                    {ticket.impacto_proceso ? (
                      <Badge variant="outline" className={`text-xs ${IMPACTO_COLOR[ticket.impacto_proceso] ?? ""}`}>
                        {IMPACTO_LABEL[ticket.impacto_proceso] ?? ticket.impacto_proceso}
                      </Badge>
                    ) : <span className="text-xs text-muted-foreground">—</span>}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground truncate max-w-24">
                    {ticket.usuario_asignado_nombre ?? "Sin asignar"}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {formatDistanceToNow(parseISO(ticket.fecha_creacion), { addSuffix: true, locale: es })}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7"
                            onClick={(e) => handleRemind(ticket.id, e)}
                            data-testid={`button-remind-${ticket.id}`}
                            disabled={remind.isPending}>
                            <Bell className="h-3.5 w-3.5" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Enviar recordatorio</TooltipContent>
                      </Tooltip>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            Página {page} de {totalPages}
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)} data-testid="button-prev-page">
              <ChevronLeft className="h-3.5 w-3.5" />
            </Button>
            <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} data-testid="button-next-page">
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
