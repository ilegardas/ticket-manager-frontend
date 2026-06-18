import { useState } from "react";
import { useLocation } from "wouter";
import {
  useCreateTicket, useListEstados, useListPrioridades, useListSistemas,
  useListModulos, useListCategorias, useListUsuarios,
  getListTicketsQueryKey, getListEstadosQueryKey, getListPrioridadesQueryKey,
  getListSistemasQueryKey, getListModulosQueryKey, getListCategoriasQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function TicketNew() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const qc = useQueryClient();

  const [form, setForm] = useState({
    titulo: "", descripcion: "", impacto_proceso: "", medio_ingreso: "portal",
    sistema_id: "", modulo_id: "", prioridad_id: "", estado_id: "",
    categoria_id: "", usuario_reporta_id: "", usuario_asignado_id: "",
  });

  const { data: estados } = useListEstados({ query: { queryKey: getListEstadosQueryKey() } });
  const { data: prioridades } = useListPrioridades({ query: { queryKey: getListPrioridadesQueryKey() } });
  const { data: sistemas } = useListSistemas({ query: { queryKey: getListSistemasQueryKey() } });
  const { data: modulos } = useListModulos(
    { sistema: form.sistema_id ? parseInt(form.sistema_id) : undefined },
    { query: { queryKey: getListModulosQueryKey({ sistema: form.sistema_id ? parseInt(form.sistema_id) : undefined }) } }
  );
  const { data: categorias } = useListCategorias({ query: { queryKey: getListCategoriasQueryKey() } });
  const { data: usuarios } = useListUsuarios({});

  const createTicket = useCreateTicket();

  const set = (key: string, val: string) => setForm((f) => ({ ...f, [key]: val }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.titulo.trim()) return;
    createTicket.mutate({
      data: {
        titulo: form.titulo,
        descripcion: form.descripcion || undefined,
        impacto_proceso: form.impacto_proceso || undefined,
        medio_ingreso: form.medio_ingreso || undefined,
        sistema_id: form.sistema_id ? parseInt(form.sistema_id) : undefined,
        modulo_id: form.modulo_id ? parseInt(form.modulo_id) : undefined,
        prioridad_id: form.prioridad_id ? parseInt(form.prioridad_id) : undefined,
        estado_id: form.estado_id ? parseInt(form.estado_id) : undefined,
        categoria_id: form.categoria_id ? parseInt(form.categoria_id) : undefined,
        usuario_reporta_id: form.usuario_reporta_id ? parseInt(form.usuario_reporta_id) : undefined,
        usuario_asignado_id: form.usuario_asignado_id ? parseInt(form.usuario_asignado_id) : undefined,
      },
    }, {
      onSuccess: (ticket) => {
        qc.invalidateQueries({ queryKey: getListTicketsQueryKey() });
        navigate(`/tickets/${ticket.id}`);
      },
      onError: () => toast({ title: "Error al crear ticket", variant: "destructive" }),
    });
  };

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate("/tickets")} data-testid="button-back">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-xl font-semibold">Nuevo Ticket</h1>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Información del Ticket</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Título *</Label>
              <Input
                value={form.titulo}
                onChange={(e) => set("titulo", e.target.value)}
                placeholder="Describe brevemente el problema"
                required
                data-testid="input-titulo"
                className="text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Descripción</Label>
              <Textarea
                value={form.descripcion}
                onChange={(e) => set("descripcion", e.target.value)}
                placeholder="Detalla el problema, pasos para reproducirlo, etc."
                className="text-sm min-h-[100px]"
                data-testid="textarea-descripcion"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Medio de Ingreso</Label>
                <Select value={form.medio_ingreso} onValueChange={(v) => set("medio_ingreso", v)}>
                  <SelectTrigger className="text-sm" data-testid="select-medio"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="portal">Portal Web</SelectItem>
                    <SelectItem value="correo">Correo</SelectItem>
                    <SelectItem value="telefono">Teléfono</SelectItem>
                    <SelectItem value="oficio">Oficio</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Impacto al Proceso</Label>
                <Select value={form.impacto_proceso} onValueChange={(v) => set("impacto_proceso", v)}>
                  <SelectTrigger className="text-sm" data-testid="select-impacto"><SelectValue placeholder="Selecciona..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="caido_total">Caído Total</SelectItem>
                    <SelectItem value="parcial">Parcialmente Funcional</SelectItem>
                    <SelectItem value="funcional">Funcional</SelectItem>
                    <SelectItem value="mejora">Requerimiento de Mejora</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Clasificación</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Sistema</Label>
              <Select value={form.sistema_id} onValueChange={(v) => { set("sistema_id", v); set("modulo_id", ""); }}>
                <SelectTrigger className="text-sm" data-testid="select-sistema"><SelectValue placeholder="Selecciona..." /></SelectTrigger>
                <SelectContent>{sistemas?.map((s) => <SelectItem key={s.id} value={String(s.id)}>{s.nombre}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Módulo</Label>
              <Select value={form.modulo_id} onValueChange={(v) => set("modulo_id", v)} disabled={!form.sistema_id}>
                <SelectTrigger className="text-sm" data-testid="select-modulo"><SelectValue placeholder="Selecciona..." /></SelectTrigger>
                <SelectContent>{modulos?.map((m) => <SelectItem key={m.id} value={String(m.id)}>{m.nombre}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Prioridad</Label>
              <Select value={form.prioridad_id} onValueChange={(v) => set("prioridad_id", v)}>
                <SelectTrigger className="text-sm" data-testid="select-prioridad"><SelectValue placeholder="Selecciona..." /></SelectTrigger>
                <SelectContent>{prioridades?.map((p) => <SelectItem key={p.id} value={String(p.id)}>{p.nombre}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Estado</Label>
              <Select value={form.estado_id} onValueChange={(v) => set("estado_id", v)}>
                <SelectTrigger className="text-sm" data-testid="select-estado"><SelectValue placeholder="Selecciona..." /></SelectTrigger>
                <SelectContent>{estados?.map((e) => <SelectItem key={e.id} value={String(e.id)}>{e.nombre}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Categoría</Label>
              <Select value={form.categoria_id} onValueChange={(v) => set("categoria_id", v)}>
                <SelectTrigger className="text-sm" data-testid="select-categoria"><SelectValue placeholder="Selecciona..." /></SelectTrigger>
                <SelectContent>{categorias?.map((c) => <SelectItem key={c.id} value={String(c.id)}>{c.nombre}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Personas</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Reportado por</Label>
              <Select value={form.usuario_reporta_id} onValueChange={(v) => set("usuario_reporta_id", v)}>
                <SelectTrigger className="text-sm" data-testid="select-reporta"><SelectValue placeholder="Selecciona..." /></SelectTrigger>
                <SelectContent>{usuarios?.map((u) => <SelectItem key={u.id} value={String(u.id)}>{u.nombre_completo}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Asignado a</Label>
              <Select value={form.usuario_asignado_id} onValueChange={(v) => set("usuario_asignado_id", v)}>
                <SelectTrigger className="text-sm" data-testid="select-asignado"><SelectValue placeholder="Sin asignar" /></SelectTrigger>
                <SelectContent>{usuarios?.filter((u) => u.rol !== "usuario").map((u) => <SelectItem key={u.id} value={String(u.id)}>{u.nombre_completo}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-2">
          <Button variant="outline" type="button" onClick={() => navigate("/tickets")}>Cancelar</Button>
          <Button type="submit" disabled={createTicket.isPending || !form.titulo.trim()} data-testid="button-submit">
            {createTicket.isPending ? "Creando..." : "Crear Ticket"}
          </Button>
        </div>
      </form>
    </div>
  );
}
