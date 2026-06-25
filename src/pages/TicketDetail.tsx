import { useState } from "react";
import { useParams, useLocation } from "wouter";
import {
  useGetTicket, useUpdateTicket, useDeleteTicket, useListChatter, useAddChatter,
  useListTimeLogs, useRemindTicket, useReopenTicket,
  useListEstados, useListPrioridades, useListSistemas, useListModulos,
  useListUsuarios, useListCategorias,
  getGetTicketQueryKey, getListChatterQueryKey, getListTimeLogsQueryKey,
  getListEstadosQueryKey, getListPrioridadesQueryKey, getListSistemasQueryKey,
  getListModulosQueryKey, getListCategoriasQueryKey, getListUsuariosQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  ArrowLeft, Bell, RotateCcw, MessageSquare, GitBranch, User,
  Clock, Calendar, Trash2, Save, AlertTriangle,
} from "lucide-react";
import { formatDistanceToNow, parseISO, format } from "date-fns";
import { es } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";

const IMPACTO_LABEL: Record<string, string> = {
  caido_total: "Caído Total",
  parcial: "Parcialmente Funcional / Degradado",
  funcional: "Funcional",
  mejora: "Requerimiento de Mejora",
};

// 🛡️ FUNCIÓN SALVAVIDAS: Evita que cualquier fecha nula o mal formateada tire la app
function safeFormatDate(dateStr: any, formatPattern: string = "dd/MM/yyyy HH:mm"): string {
  if (!dateStr) return "—";
  try {
    let cleanStr = String(dateStr);
    if (cleanStr.includes('-') && cleanStr.split('-').length === 4) {
      cleanStr = cleanStr.substring(0, cleanStr.lastIndexOf('-'));
    } else if (cleanStr.includes('+')) {
      cleanStr = cleanStr.split('+')[0];
    }
    if (!cleanStr.endsWith('Z')) cleanStr += 'Z';

    const parsed = parseISO(cleanStr);
    if (isNaN(parsed.getTime())) return "—";
    return format(parsed, formatPattern);
  } catch (e) {
    return "—";
  }
}

// 🛡️ FUNCIÓN SALVAVIDAS PARA EL HISTORIAL (Chatter)
function safeFormatDistance(dateStr: any): string {
  if (!dateStr) return "hace un momento";
  try {
    let cleanStr = String(dateStr);
    if (cleanStr.includes('-') && cleanStr.split('-').length === 4) {
      cleanStr = cleanStr.substring(0, cleanStr.lastIndexOf('-'));
    } else if (cleanStr.includes('+')) {
      cleanStr = cleanStr.split('+')[0];
    }
    if (!cleanStr.endsWith('Z')) cleanStr += 'Z';

    const parsed = parseISO(cleanStr);
    if (isNaN(parsed.getTime())) return "hace un momento";
    return formatDistanceToNow(parsed, { addSuffix: true, locale: es });
  } catch (e) {
    return "hace un momento";
  }
}

function ChatterIcon({ tipo }: { tipo: string }) {
  if (tipo === "comentario") return <MessageSquare className="h-3.5 w-3.5 text-primary" />;
  if (tipo === "cambio_estado") return <GitBranch className="h-3.5 w-3.5 text-violet-500" />;
  if (tipo === "asignacion") return <User className="h-3.5 w-3.5 text-amber-500" />;
  return <Clock className="h-3.5 w-3.5 text-muted-foreground" />;
}

export default function TicketDetail() {
  const { id } = useParams<{ id: string }>();
  const ticketId = parseInt(id);
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const qc = useQueryClient();

  const [comentario, setComentario] = useState("");
  const [editMode, setEditMode] = useState(false);
  const [editData, setEditData] = useState<Record<string, string | number | undefined>>({});

  const { data: ticket, isLoading } = useGetTicket(ticketId, {
    query: { queryKey: getGetTicketQueryKey(ticketId), enabled: !!ticketId },
  });
  const { data: chatter } = useListChatter(ticketId, {
    query: { queryKey: getListChatterQueryKey(ticketId), enabled: !!ticketId },
  });
  const { data: timeLogs } = useListTimeLogs(ticketId, {
    query: { queryKey: getListTimeLogsQueryKey(ticketId), enabled: !!ticketId },
  });
  const { data: estados } = useListEstados({ query: { queryKey: getListEstadosQueryKey() } });
  const { data: prioridades } = useListPrioridades({ query: { queryKey: getListPrioridadesQueryKey() } });
  const { data: sistemas } = useListSistemas({ query: { queryKey: getListSistemasQueryKey() } });
  const { data: modulos } = useListModulos(
    { sistema: editData.sistema_id as number ?? ticket?.sistema_id ?? undefined },
    { query: { queryKey: getListModulosQueryKey({ sistema: editData.sistema_id as number ?? ticket?.sistema_id ?? undefined }) } }
  );
  const { data: categorias } = useListCategorias({ query: { queryKey: getListCategoriasQueryKey() } });
  const { data: todosUsuarios } = useListUsuarios({}, { query: { queryKey: getListUsuariosQueryKey() } });
  const tecnicos = todosUsuarios?.filter((u) => u.rol === "tecnico") ?? [];

  const addChatter = useAddChatter();
  const updateTicket = useUpdateTicket();
  const deleteTicket = useDeleteTicket();
  const remind = useRemindTicket();
  const reopen = useReopenTicket();

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: getGetTicketQueryKey(ticketId) });
    qc.invalidateQueries({ queryKey: getListChatterQueryKey(ticketId) });
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comentario.trim()) return;
    addChatter.mutate({ id: ticketId, data: { contenido: comentario } }, {
      onSuccess: () => {
        setComentario("");
        invalidate();
      },
      onError: () => toast({ title: "Error al agregar comentario", variant: "destructive" }),
    });
  };

  const handleSave = () => {
    updateTicket.mutate({ id: ticketId, data: editData }, {
      onSuccess: () => {
        setEditMode(false);
        setEditData({});
        invalidate();
        toast({ title: "Ticket actualizado" });
      },
      onError: () => toast({ title: "Error al actualizar", variant: "destructive" }),
    });
  };

  const handleDelete = () => {
    deleteTicket.mutate({ id: ticketId }, {
      onSuccess: () => navigate("/tickets"),
      onError: () => toast({ title: "Error al eliminar", variant: "destructive" }),
    });
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-4 max-w-5xl mx-auto">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 rounded-lg" />
      </div>
    );
  }

  if (!ticket) return null;

  const totalPausaMin = ticket.tiempo_pausa_minutos ?? 0;
  const efectivoMin = ticket.tiempo_efectivo_minutos;

  function minutesToHm(min: number | null | undefined) {
    if (min == null) return "—";
    const h = Math.floor(min / 60);
    const m = min % 60;
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  }

  const field = (key: string) => editData[key] !== undefined ? String(editData[key]) : undefined;
  const setField = (key: string, val: string | number | undefined) =>
    setEditData((prev) => ({ ...prev, [key]: val }));

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="h-8 w-8 text-border" onClick={() => navigate("/tickets")} data-testid="button-back">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-mono font-medium text-card-border">{ticket.folio}</span>
              {ticket.ticket_reabierto && <Badge variant="outline" className="text-xs text-amber-500 border-amber-300">Reabierto</Badge>}
            </div>
            <h1 className="text-base font-semibold mt-0.5 text-muted-foreground">{ticket.titulo}</h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => remind.mutate({ id: ticketId }, {
            onSuccess: () => toast({ title: "Recordatorio enviado" }),
          })} data-testid="button-remind">
            <Bell className="h-3.5 w-3.5 mr-1.5" /> Recordatorio
          </Button>
          {ticket.estado_nombre && ['Cerrado', 'Cancelado'].includes(ticket.estado_nombre) && (
            <Button variant="outline" size="sm" onClick={() => reopen.mutate({ id: ticketId }, {
              onSuccess: () => invalidate(),
            })} data-testid="button-reopen">
              <RotateCcw className="h-3.5 w-3.5 mr-1.5" /> Reabrir
            </Button>
          )}
          {!editMode ? (
            <Button size="sm" onClick={() => setEditMode(true)} data-testid="button-edit">Editar</Button>
          ) : (
            <div className="flex gap-1.5">
              <Button size="sm" variant="outline" onClick={() => { setEditMode(false); setEditData({}); }}>Cancelar</Button>
              <Button size="sm" onClick={handleSave} disabled={updateTicket.isPending} data-testid="button-save">
                <Save className="h-3.5 w-3.5 mr-1.5" /> Guardar
              </Button>
            </div>
          )}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" data-testid="button-delete">
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Eliminar ticket</AlertDialogTitle>
                <AlertDialogDescription>Esta acción no se puede deshacer.</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Eliminar</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main left: description + chatter */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardContent className="pt-4 space-y-3">
              <div>
                <Label className="text-xs text-muted-foreground">Descripción</Label>
                {editMode ? (
                  <Textarea className="mt-1 text-sm" value={field("descripcion") ?? ticket.descripcion ?? ""} onChange={(e) => setField("descripcion", e.target.value)} />
                ) : (
                  <p className="text-sm mt-1">{ticket.descripcion ?? "Sin descripción"}</p>
                )}
              </div>
              {(ticket.codigo_error || editMode) && (
                <div>
                  <Label className="text-xs text-muted-foreground">Código de Error</Label>
                  {editMode ? (
                    <Input className="mt-1 h-7 text-sm font-mono" value={field("codigo_error") ?? ticket.codigo_error ?? ""} onChange={(e) => setField("codigo_error", e.target.value)} />
                  ) : (
                    <p className="text-sm font-mono mt-1">{ticket.codigo_error}</p>
                  )}
                </div>
              )}
              {(ticket.solucion_aplicada || editMode) && (
                <div>
                  <Label className="text-xs text-muted-foreground">Solución Aplicada</Label>
                  {editMode ? (
                    <Textarea className="mt-1 text-sm" value={field("solucion_aplicada") ?? ticket.solucion_aplicada ?? ""} onChange={(e) => setField("solucion_aplicada", e.target.value)} />
                  ) : (
                    <p className="text-sm mt-1">{ticket.solucion_aplicada}</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Chatter */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Historial</CardTitle>
            </CardHeader>
            <CardContent className="space-y-0">
              <div className="space-y-0">
                {chatter?.map((entry) => (
                  <div key={entry.id} className="flex items-start gap-3 py-3 border-b last:border-0">
                    <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center shrink-0 mt-0.5">
                      <ChatterIcon tipo={entry.tipo} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-medium">{entry.autor_nombre ?? "Sistema"}</span>
                        {entry.tipo === "cambio_estado" && entry.estado_nuevo && (
                          <span className="text-xs text-muted-foreground">
                            {entry.estado_anterior ?? "—"} → <span className="text-foreground">{entry.estado_nuevo}</span>
                          </span>
                        )}
                        <span className="text-xs text-muted-foreground ml-auto">
                          {/* 🛡️ APLICADO: Formateo de distancia seguro */}
                          {safeFormatDistance(entry.fecha_creacion)}
                        </span>
                      </div>
                      {entry.contenido && entry.tipo === "comentario" && (
                        <p className="text-sm mt-1 bg-muted/50 rounded p-2">{entry.contenido}</p>
                      )}
                      {entry.contenido && entry.tipo !== "comentario" && entry.tipo !== "cambio_estado" && (
                        <p className="text-xs text-muted-foreground mt-1">{entry.contenido}</p>
                      )}
                    </div>
                  </div>
                ))}
                {!chatter?.length && (
                  <p className="text-xs text-muted-foreground text-center py-4">Sin actividad aún</p>
                )}
              </div>
              <form onSubmit={handleAddComment} className="pt-3 space-y-2">
                <Textarea
                  placeholder="Escribe un comentario..."
                  value={comentario}
                  onChange={(e) => setComentario(e.target.value)}
                  className="text-sm min-h-[70px]"
                  data-testid="textarea-comentario"
                />
                <Button type="submit" size="sm" disabled={addChatter.isPending || !comentario.trim()} data-testid="button-add-comment">
                  <MessageSquare className="h-3.5 w-3.5 mr-1.5" /> Comentar
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Right: metadata */}
        <div className="space-y-4">
          <Card>
            <CardContent className="pt-4 space-y-3">
              <div className="space-y-2.5">
                <div>
                  <Label className="text-xs text-muted-foreground">Estado</Label>
                  {editMode ? (
                    <Select value={field("estado_id") ?? String(ticket.estado_id ?? "")} onValueChange={(v) => setField("estado_id", parseInt(v))}>
                      <SelectTrigger className="mt-1 h-7 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>{estados?.map((e) => <SelectItem key={e.id} value={String(e.id)}>{e.nombre}</SelectItem>)}</SelectContent>
                    </Select>
                  ) : ticket.estado_nombre ? (
                    <div className="mt-1">
                      <Badge variant="outline" style={{ borderColor: ticket.estado_color ?? undefined, color: ticket.estado_color ?? undefined }}>
                        {ticket.estado_nombre}
                      </Badge>
                    </div>
                  ) : "—"}
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Prioridad</Label>
                  {editMode ? (
                    <Select value={field("prioridad_id") ?? String(ticket.prioridad_id ?? "")} onValueChange={(v) => setField("prioridad_id", parseInt(v))}>
                      <SelectTrigger className="mt-1 h-7 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>{prioridades?.map((p) => <SelectItem key={p.id} value={String(p.id)}>{p.nombre}</SelectItem>)}</SelectContent>
                    </Select>
                  ) : ticket.prioridad_nombre ? (
                    <div className="mt-1">
                      <Badge variant="outline" style={{ borderColor: ticket.prioridad_color ?? undefined, color: ticket.prioridad_color ?? undefined }}>
                        {ticket.prioridad_nombre}
                      </Badge>
                    </div>
                  ) : "—"}
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Sistema</Label>
                  {editMode ? (
                    <Select value={field("sistema_id") ?? String(ticket.sistema_id ?? "")} onValueChange={(v) => setField("sistema_id", parseInt(v))}>
                      <SelectTrigger className="mt-1 h-7 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>{sistemas?.map((s) => <SelectItem key={s.id} value={String(s.id)}>{s.nombre}</SelectItem>)}</SelectContent>
                    </Select>
                  ) : <p className="text-xs mt-1">{ticket.sistema_nombre ?? "—"}</p>}
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Módulo</Label>
                  {editMode ? (
                    <Select value={field("modulo_id") ?? String(ticket.modulo_id ?? "")} onValueChange={(v) => setField("modulo_id", parseInt(v))}>
                      <SelectTrigger className="mt-1 h-7 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>{modulos?.map((m) => <SelectItem key={m.id} value={String(m.id)}>{m.nombre}</SelectItem>)}</SelectContent>
                    </Select>
                  ) : <p className="text-xs mt-1">{ticket.modulo_nombre ?? "—"}</p>}
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Categoría</Label>
                  {editMode ? (
                    <Select value={field("categoria_id") ?? String(ticket.categoria_id ?? "")} onValueChange={(v) => setField("categoria_id", parseInt(v))}>
                      <SelectTrigger className="mt-1 h-7 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>{categorias?.map((c) => <SelectItem key={c.id} value={String(c.id)}>{c.nombre}</SelectItem>)}</SelectContent>
                    </Select>
                  ) : <p className="text-xs mt-1">{ticket.categoria_nombre ?? "—"}</p>}
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Impacto al Proceso</Label>
                  {editMode ? (
                    <Select
                      value={field("impacto_proceso") ?? (ticket.impacto_proceso ?? "none")}
                      onValueChange={(v) => setField("impacto_proceso", v === "none" ? undefined : v)}
                    >
                      <SelectTrigger className="mt-1 h-7 text-xs"><SelectValue placeholder="Sin especificar" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Sin especificar</SelectItem>
                        <SelectItem value="caido_total">Caído Total</SelectItem>
                        <SelectItem value="parcial">Parcialmente Funcional / Degradado</SelectItem>
                        <SelectItem value="funcional">Funcional</SelectItem>
                        <SelectItem value="mejora">Requerimiento de Mejora</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <p className="text-xs mt-1">{IMPACTO_LABEL[ticket.impacto_proceso ?? ""] ?? "—"}</p>
                  )}
                </div>
              </div>
              <Separator />
              <div className="space-y-1.5 text-xs text-muted-foreground">
                <div className="flex justify-between">
                  <span>Reportado por</span>
                  <span className="text-foreground">{ticket.usuario_reporta_nombre ?? "—"}</span>
                </div>
                <div className={editMode ? "flex flex-col gap-1" : "flex justify-between"}>
                  <span>Asignado a</span>
                  {editMode ? (
                    <Select
                      value={field("usuario_asignado_id") != null ? String(field("usuario_asignado_id")) : (ticket.usuario_asignado_id ? String(ticket.usuario_asignado_id) : "none")}
                      onValueChange={(v) => setField("usuario_asignado_id", v === "none" ? undefined : parseInt(v))}
                    >
                      <SelectTrigger className="h-7 text-xs">
                        <SelectValue placeholder="Sin asignar" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Sin asignar</SelectItem>
                        {tecnicos.map((t) => (
                          <SelectItem key={t.id} value={String(t.id)}>{t.nombre_completo}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <span className="text-foreground">{ticket.usuario_asignado_nombre ?? "Sin asignar"}</span>
                  )}
                </div>
                <div className="flex justify-between">
                  <span>Creado</span>
                  {/* 🛡️ APLICADO: Formateo seguro de fechas */}
                  <span className="text-foreground">{safeFormatDate(ticket.fecha_creacion)}</span>
                </div>
                {ticket.fecha_asignacion && (
                  <div className="flex justify-between">
                    <span>Asignado</span>
                    {/* 🛡️ APLICADO: Formateo seguro de fechas */}
                    <span className="text-foreground">{safeFormatDate(ticket.fecha_asignacion)}</span>
                  </div>
                )}
                {ticket.fecha_cierre && (
                  <div className="flex justify-between">
                    <span>Cerrado</span>
                    {/* 🛡️ APLICADO: Formateo seguro de fechas */}
                    <span className="text-foreground">{safeFormatDate(ticket.fecha_cierre)}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* SLA Time */}
          <Card>
            <CardHeader className="pb-1">
              <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Tiempo SLA</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Tiempo total</span>
                <span>{minutesToHm(ticket.tiempo_atencion_minutos)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">En pausa</span>
                <span className="text-amber-500">{minutesToHm(totalPausaMin)}</span>
              </div>
              <Separator />
              <div className="flex justify-between text-xs font-medium">
                <span>Tiempo efectivo</span>
                <span className="text-primary">{minutesToHm(efectivoMin)}</span>
              </div>
              {timeLogs && timeLogs.length > 0 && (
                <div className="mt-2 space-y-1">
                  <p className="text-xs text-muted-foreground">Pausas</p>
                  {timeLogs.map((log) => (
                    <div key={log.id} className="text-xs flex justify-between">
                      <span className="text-muted-foreground truncate">{log.estado_pausa}</span>
                      <span>{minutesToHm(log.duracion_minutos)}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
