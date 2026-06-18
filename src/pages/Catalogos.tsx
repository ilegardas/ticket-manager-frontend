import { useState } from "react";
import {
  useListPrioridades, useCreatePrioridad, useUpdatePrioridad, useDeletePrioridad,
  useListEstados, useCreateEstado, useUpdateEstado, useDeleteEstado,
  useListCategorias, useCreateCategoria, useUpdateCategoria, useDeleteCategoria,
  getListPrioridadesQueryKey, getListEstadosQueryKey, getListCategoriasQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

function ColorDot({ color }: { color?: string | null }) {
  return <span className="inline-block w-3 h-3 rounded-full border" style={{ backgroundColor: color ?? "#6B7280" }} />;
}

// ── PRIORIDADES ─────────────────────────────────────────────────────────────

function PrioridadesTab() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState({ nombre: "", sla_horas: "24", color: "#6B7280", orden: "0" });

  const { data: prioridades } = useListPrioridades({ query: { queryKey: getListPrioridadesQueryKey() } });
  const createPrioridad = useCreatePrioridad();
  const updatePrioridad = useUpdatePrioridad();
  const deletePrioridad = useDeletePrioridad();

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));
  const invalidate = () => qc.invalidateQueries({ queryKey: getListPrioridadesQueryKey() });

  const openCreate = () => { setEditId(null); setForm({ nombre: "", sla_horas: "24", color: "#6B7280", orden: "0" }); setOpen(true); };
  const openEdit = (p: { id: number; nombre: string; sla_horas?: number; color?: string | null; orden?: number }) => {
    setEditId(p.id);
    setForm({ nombre: p.nombre, sla_horas: String(p.sla_horas ?? 24), color: p.color ?? "#6B7280", orden: String(p.orden ?? 0) });
    setOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data = { nombre: form.nombre, sla_horas: parseInt(form.sla_horas), color: form.color, orden: parseInt(form.orden) };
    if (editId) {
      updatePrioridad.mutate({ id: editId, data }, { onSuccess: () => { invalidate(); setOpen(false); toast({ title: "Prioridad actualizada" }); } });
    } else {
      createPrioridad.mutate({ data }, { onSuccess: () => { invalidate(); setOpen(false); setForm({ nombre: "", sla_horas: "24", color: "#6B7280", orden: "0" }); toast({ title: "Prioridad creada" }); } });
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" onClick={openCreate} data-testid="button-nueva-prioridad"><Plus className="h-3.5 w-3.5 mr-1.5" /> Nueva</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{editId ? "Editar" : "Nueva"} Prioridad</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Nombre *</Label>
                <Input value={form.nombre} onChange={(e) => set("nombre", e.target.value)} required data-testid="input-nombre" />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">SLA (horas)</Label>
                  <Input type="number" value={form.sla_horas} onChange={(e) => set("sla_horas", e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Color</Label>
                  <div className="flex items-center gap-2">
                    <input type="color" value={form.color} onChange={(e) => set("color", e.target.value)} className="h-9 w-full rounded border cursor-pointer" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Orden</Label>
                  <Input type="number" value={form.orden} onChange={(e) => set("orden", e.target.value)} />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" type="button" onClick={() => setOpen(false)}>Cancelar</Button>
                <Button type="submit">{editId ? "Guardar" : "Crear"}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      <div className="space-y-2">
        {prioridades?.map((p) => (
          <Card key={p.id} data-testid={`card-prioridad-${p.id}`}>
            <CardContent className="py-2.5 flex items-center gap-3">
              <ColorDot color={p.color} />
              <div className="flex-1">
                <span className="text-sm font-medium">{p.nombre}</span>
                <span className="text-xs text-muted-foreground ml-2">SLA: {p.sla_horas}h · orden {p.orden}</span>
              </div>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(p)} data-testid={`button-edit-prioridad-${p.id}`}><Pencil className="h-3.5 w-3.5" /></Button>
              <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => deletePrioridad.mutate({ id: p.id }, { onSuccess: invalidate })} data-testid={`button-delete-prioridad-${p.id}`}><Trash2 className="h-3.5 w-3.5" /></Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ── ESTADOS ──────────────────────────────────────────────────────────────────

function EstadosTab() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState({ nombre: "", es_estado_cierre: false, pausa_sla: false, color: "#6B7280", orden: "0" });

  const { data: estados } = useListEstados({ query: { queryKey: getListEstadosQueryKey() } });
  const createEstado = useCreateEstado();
  const updateEstado = useUpdateEstado();
  const deleteEstado = useDeleteEstado();

  const set = (k: string, v: string | boolean) => setForm((f) => ({ ...f, [k]: v }));
  const invalidate = () => qc.invalidateQueries({ queryKey: getListEstadosQueryKey() });

  const openCreate = () => { setEditId(null); setForm({ nombre: "", es_estado_cierre: false, pausa_sla: false, color: "#6B7280", orden: "0" }); setOpen(true); };
  const openEdit = (e: { id: number; nombre: string; es_estado_cierre?: boolean; pausa_sla?: boolean; color?: string | null; orden?: number }) => {
    setEditId(e.id);
    setForm({ nombre: e.nombre, es_estado_cierre: e.es_estado_cierre ?? false, pausa_sla: e.pausa_sla ?? false, color: e.color ?? "#6B7280", orden: String(e.orden ?? 0) });
    setOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data = { nombre: form.nombre, es_estado_cierre: form.es_estado_cierre, pausa_sla: form.pausa_sla, color: form.color, orden: parseInt(form.orden as string) };
    if (editId) {
      updateEstado.mutate({ id: editId, data }, { onSuccess: () => { invalidate(); setOpen(false); toast({ title: "Estado actualizado" }); } });
    } else {
      createEstado.mutate({ data }, { onSuccess: () => { invalidate(); setOpen(false); toast({ title: "Estado creado" }); } });
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" onClick={openCreate} data-testid="button-nuevo-estado"><Plus className="h-3.5 w-3.5 mr-1.5" /> Nuevo</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{editId ? "Editar" : "Nuevo"} Estado</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Nombre *</Label>
                <Input value={form.nombre} onChange={(e) => set("nombre", e.target.value)} required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Color</Label>
                  <input type="color" value={form.color} onChange={(e) => set("color", e.target.value)} className="h-9 w-full rounded border cursor-pointer" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Orden</Label>
                  <Input type="number" value={form.orden} onChange={(e) => set("orden", e.target.value)} />
                </div>
              </div>
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <Label className="text-xs">Estado de Cierre</Label>
                  <Switch checked={form.es_estado_cierre} onCheckedChange={(v) => set("es_estado_cierre", v)} />
                </div>
                <div className="flex items-center justify-between">
                  <Label className="text-xs">Pausa SLA</Label>
                  <Switch checked={form.pausa_sla} onCheckedChange={(v) => set("pausa_sla", v)} />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" type="button" onClick={() => setOpen(false)}>Cancelar</Button>
                <Button type="submit">{editId ? "Guardar" : "Crear"}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      <div className="space-y-2">
        {estados?.map((e) => (
          <Card key={e.id} data-testid={`card-estado-${e.id}`}>
            <CardContent className="py-2.5 flex items-center gap-3">
              <ColorDot color={e.color} />
              <div className="flex-1 flex items-center gap-2 flex-wrap">
                <span className="text-sm font-medium">{e.nombre}</span>
                {e.es_estado_cierre && <Badge variant="outline" className="text-xs text-green-600 border-green-300">Cierre</Badge>}
                {e.pausa_sla && <Badge variant="outline" className="text-xs text-amber-600 border-amber-300">Pausa SLA</Badge>}
                <span className="text-xs text-muted-foreground">orden {e.orden}</span>
              </div>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(e)} data-testid={`button-edit-estado-${e.id}`}><Pencil className="h-3.5 w-3.5" /></Button>
              <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => deleteEstado.mutate({ id: e.id }, { onSuccess: invalidate })} data-testid={`button-delete-estado-${e.id}`}><Trash2 className="h-3.5 w-3.5" /></Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ── CATEGORIAS ────────────────────────────────────────────────────────────────

function CategoriasTab() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState({ nombre: "", descripcion: "", color: "#6B7280" });

  const { data: categorias } = useListCategorias({ query: { queryKey: getListCategoriasQueryKey() } });
  const createCategoria = useCreateCategoria();
  const updateCategoria = useUpdateCategoria();
  const deleteCategoria = useDeleteCategoria();

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));
  const invalidate = () => qc.invalidateQueries({ queryKey: getListCategoriasQueryKey() });

  const openCreate = () => { setEditId(null); setForm({ nombre: "", descripcion: "", color: "#6B7280" }); setOpen(true); };
  const openEdit = (c: { id: number; nombre: string; descripcion?: string | null; color?: string | null }) => {
    setEditId(c.id);
    setForm({ nombre: c.nombre, descripcion: c.descripcion ?? "", color: c.color ?? "#6B7280" });
    setOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data = { nombre: form.nombre, descripcion: form.descripcion || undefined, color: form.color };
    if (editId) {
      updateCategoria.mutate({ id: editId, data }, { onSuccess: () => { invalidate(); setOpen(false); toast({ title: "Categoría actualizada" }); } });
    } else {
      createCategoria.mutate({ data }, { onSuccess: () => { invalidate(); setOpen(false); toast({ title: "Categoría creada" }); } });
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" onClick={openCreate} data-testid="button-nueva-categoria"><Plus className="h-3.5 w-3.5 mr-1.5" /> Nueva</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{editId ? "Editar" : "Nueva"} Categoría</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Nombre *</Label>
                <Input value={form.nombre} onChange={(e) => set("nombre", e.target.value)} required data-testid="input-nombre" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Descripción</Label>
                <Input value={form.descripcion} onChange={(e) => set("descripcion", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Color</Label>
                <input type="color" value={form.color} onChange={(e) => set("color", e.target.value)} className="h-9 w-full rounded border cursor-pointer" />
              </div>
              <DialogFooter>
                <Button variant="outline" type="button" onClick={() => setOpen(false)}>Cancelar</Button>
                <Button type="submit">{editId ? "Guardar" : "Crear"}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {categorias?.map((c) => (
          <Card key={c.id} data-testid={`card-categoria-${c.id}`}>
            <CardContent className="py-2.5 flex items-center gap-3">
              <ColorDot color={c.color} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{c.nombre}</p>
                {c.descripcion && <p className="text-xs text-muted-foreground truncate">{c.descripcion}</p>}
              </div>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(c)}><Pencil className="h-3.5 w-3.5" /></Button>
              <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => deleteCategoria.mutate({ id: c.id }, { onSuccess: invalidate })}><Trash2 className="h-3.5 w-3.5" /></Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export default function Catalogos() {
  return (
    <div className="p-6 space-y-4 max-w-3xl mx-auto">
      <div>
        <h1 className="text-xl font-semibold">Catálogos</h1>
        <p className="text-sm text-muted-foreground">Gestión de prioridades, estados y categorías</p>
      </div>
      <Tabs defaultValue="prioridades">
        <TabsList>
          <TabsTrigger value="prioridades" className="text-xs">Prioridades</TabsTrigger>
          <TabsTrigger value="estados" className="text-xs">Estados</TabsTrigger>
          <TabsTrigger value="categorias" className="text-xs">Categorías</TabsTrigger>
        </TabsList>
        <TabsContent value="prioridades" className="mt-4"><PrioridadesTab /></TabsContent>
        <TabsContent value="estados" className="mt-4"><EstadosTab /></TabsContent>
        <TabsContent value="categorias" className="mt-4"><CategoriasTab /></TabsContent>
      </Tabs>
    </div>
  );
}
