import { useState } from "react";
import { useLocation } from "wouter";
import {
  useListConocimiento, useCreateConocimiento, useGetConocimiento, useDeleteConocimiento,
  useListSistemas,
  getListConocimientoQueryKey, getListSistemasQueryKey, getGetConocimientoQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";
import { BookOpen, Plus, Search, Trash2, Code2, CheckCircle2 } from "lucide-react";
import { formatDistanceToNow, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";

export default function Conocimiento() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [sistemaFilter, setSistemaFilter] = useState("all");
  const [causaFilter, setCausaFilter] = useState("all");
  const [open, setOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [form, setForm] = useState({
    titulo: "", descripcion_problema: "", codigo_error: "",
    solucion_aplicada: "", causa_raiz: "", sistema_id: "",
  });

  const params = {
    search: search || undefined,
    sistema: sistemaFilter !== "all" ? parseInt(sistemaFilter) : undefined,
    causa_raiz: causaFilter !== "all" ? causaFilter : undefined,
  };

  const { data: entries, isLoading } = useListConocimiento(params, {
    query: { queryKey: getListConocimientoQueryKey(params) },
  });
  const { data: sistemas } = useListSistemas({ query: { queryKey: getListSistemasQueryKey() } });
  const { data: selected } = useGetConocimiento(selectedId!, {
    query: { queryKey: getGetConocimientoQueryKey(selectedId!), enabled: !!selectedId },
  });
  const createConocimiento = useCreateConocimiento();
  const deleteConocimiento = useDeleteConocimiento();

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    createConocimiento.mutate({ data: {
      titulo: form.titulo,
      descripcion_problema: form.descripcion_problema || undefined,
      codigo_error: form.codigo_error || undefined,
      solucion_aplicada: form.solucion_aplicada || undefined,
      causa_raiz: form.causa_raiz || undefined,
      sistema_id: form.sistema_id ? parseInt(form.sistema_id) : undefined,
    }}, {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: getListConocimientoQueryKey() });
        setOpen(false);
        setForm({ titulo: "", descripcion_problema: "", codigo_error: "", solucion_aplicada: "", causa_raiz: "", sistema_id: "" });
        toast({ title: "Entrada creada" });
      },
    });
  };

  const causas = ["bug_codigo", "caida_servidor", "error_humano", "datos_corruptos", "configuracion", "red", "permisos", "otro"];
  const causaLabels: Record<string, string> = {
    bug_codigo: "Bug de Código", caida_servidor: "Caída de Servidor", error_humano: "Error Humano",
    datos_corruptos: "Datos Corruptos", configuracion: "Configuración", red: "Red",
    permisos: "Permisos", otro: "Otro",
  };

  return (
    <div className="p-6 space-y-4 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Base de Conocimiento</h1>
          <p className="text-sm text-muted-foreground">{entries?.length ?? 0} entradas</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" data-testid="button-nueva-entrada"><Plus className="h-3.5 w-3.5 mr-1.5" /> Nueva Entrada</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>Nueva Entrada de Conocimiento</DialogTitle></DialogHeader>
            <form onSubmit={handleCreate} className="space-y-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Título *</Label>
                <Input value={form.titulo} onChange={(e) => set("titulo", e.target.value)} required data-testid="input-titulo" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Descripción del Problema</Label>
                <Textarea value={form.descripcion_problema} onChange={(e) => set("descripcion_problema", e.target.value)} className="min-h-[60px]" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Código de Error</Label>
                  <Input value={form.codigo_error} onChange={(e) => set("codigo_error", e.target.value)} className="font-mono" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Causa Raíz</Label>
                  <Select value={form.causa_raiz} onValueChange={(v) => set("causa_raiz", v)}>
                    <SelectTrigger><SelectValue placeholder="Selecciona..." /></SelectTrigger>
                    <SelectContent>{causas.map((c) => <SelectItem key={c} value={c}>{causaLabels[c]}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Solución Aplicada</Label>
                <Textarea value={form.solucion_aplicada} onChange={(e) => set("solucion_aplicada", e.target.value)} className="min-h-[70px]" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Sistema</Label>
                <Select value={form.sistema_id} onValueChange={(v) => set("sistema_id", v)}>
                  <SelectTrigger><SelectValue placeholder="Sin sistema" /></SelectTrigger>
                  <SelectContent>{sistemas?.map((s) => <SelectItem key={s.id} value={String(s.id)}>{s.nombre}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <DialogFooter>
                <Button variant="outline" type="button" onClick={() => setOpen(false)}>Cancelar</Button>
                <Button type="submit" disabled={createConocimiento.isPending}>Crear</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input placeholder="Buscar título, código de error..." className="pl-8 h-8 text-sm" value={search} onChange={(e) => setSearch(e.target.value)} data-testid="input-search" />
        </div>
        <Select value={sistemaFilter} onValueChange={setSistemaFilter}>
          <SelectTrigger className="h-8 text-sm w-40"><SelectValue placeholder="Sistema" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            {sistemas?.map((s) => <SelectItem key={s.id} value={String(s.id)}>{s.nombre}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={causaFilter} onValueChange={setCausaFilter}>
          <SelectTrigger className="h-8 text-sm w-44"><SelectValue placeholder="Causa raíz" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las causas</SelectItem>
            {causas.map((c) => <SelectItem key={c} value={c}>{causaLabels[c]}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-lg" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {entries?.map((entry) => (
            <Card key={entry.id} className="cursor-pointer hover:border-primary/40 transition-colors"
              data-testid={`card-conocimiento-${entry.id}`}
              onClick={() => setSelectedId(entry.id)}>
              <CardContent className="pt-3 pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-3.5 w-3.5 text-primary shrink-0" />
                    <p className="text-sm font-medium line-clamp-1">{entry.titulo}</p>
                  </div>
                  <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive shrink-0"
                    onClick={(e) => { e.stopPropagation(); deleteConocimiento.mutate({ id: entry.id }, { onSuccess: () => qc.invalidateQueries({ queryKey: getListConocimientoQueryKey() }) }); }}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
                {entry.codigo_error && (
                  <div className="flex items-center gap-1.5 mt-1.5">
                    <Code2 className="h-3 w-3 text-muted-foreground" />
                    <span className="text-xs font-mono text-muted-foreground">{entry.codigo_error}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 mt-2">
                  {entry.sistema_nombre && <Badge variant="outline" className="text-xs">{entry.sistema_nombre}</Badge>}
                  {entry.causa_raiz && <Badge variant="secondary" className="text-xs">{causaLabels[entry.causa_raiz] ?? entry.causa_raiz}</Badge>}
                  <span className="text-xs text-muted-foreground ml-auto">{entry.veces_consultado} consultas</span>
                </div>
              </CardContent>
            </Card>
          ))}
          {!entries?.length && (
            <p className="text-sm text-muted-foreground col-span-2 text-center py-12">Sin entradas en la base de conocimiento</p>
          )}
        </div>
      )}

      {/* Detail dialog */}
      <Dialog open={!!selectedId} onOpenChange={() => setSelectedId(null)}>
        <DialogContent className="max-w-lg">
          {selected && (
            <>
              <DialogHeader><DialogTitle>{selected.titulo}</DialogTitle></DialogHeader>
              <div className="space-y-3">
                {selected.codigo_error && (
                  <div>
                    <Label className="text-xs text-muted-foreground">Código de Error</Label>
                    <p className="text-sm font-mono mt-0.5 bg-muted/50 px-2 py-1 rounded">{selected.codigo_error}</p>
                  </div>
                )}
                {selected.descripcion_problema && (
                  <div>
                    <Label className="text-xs text-muted-foreground">Descripción del Problema</Label>
                    <p className="text-sm mt-0.5">{selected.descripcion_problema}</p>
                  </div>
                )}
                {selected.solucion_aplicada && (
                  <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
                    <div className="flex items-center gap-1.5 mb-1">
                      <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
                      <Label className="text-xs text-green-700 dark:text-green-400">Solución Aplicada</Label>
                    </div>
                    <p className="text-sm text-green-900 dark:text-green-100">{selected.solucion_aplicada}</p>
                  </div>
                )}
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  {selected.sistema_nombre && <Badge variant="outline">{selected.sistema_nombre}</Badge>}
                  {selected.causa_raiz && <span>{causaLabels[selected.causa_raiz] ?? selected.causa_raiz}</span>}
                  <span className="ml-auto">{selected.veces_consultado} consultas</span>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
