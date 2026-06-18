import { useState } from "react";
import {
  useListModulos, useCreateModulo, useDeleteModulo, useListSistemas,
  getListModulosQueryKey, getListSistemasQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";
import { Plus, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Modulos() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [sistemaFilter, setSistemaFilter] = useState("all");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ nombre: "", descripcion: "", sistema_id: "" });

  const params = sistemaFilter !== "all" ? { sistema: parseInt(sistemaFilter) } : {};
  const { data: modulos, isLoading } = useListModulos(params, {
    query: { queryKey: getListModulosQueryKey(params) },
  });
  const { data: sistemas } = useListSistemas({ query: { queryKey: getListSistemasQueryKey() } });
  const createModulo = useCreateModulo();
  const deleteModulo = useDeleteModulo();

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nombre || !form.sistema_id) return;
    createModulo.mutate({ data: { nombre: form.nombre, descripcion: form.descripcion || undefined, sistema_id: parseInt(form.sistema_id) } }, {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: getListModulosQueryKey() });
        setOpen(false);
        setForm({ nombre: "", descripcion: "", sistema_id: "" });
        toast({ title: "Módulo creado" });
      },
    });
  };

  return (
    <div className="p-6 space-y-4 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Módulos</h1>
          <p className="text-sm text-muted-foreground">{modulos?.length ?? 0} módulos</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" data-testid="button-nuevo-modulo"><Plus className="h-3.5 w-3.5 mr-1.5" /> Nuevo Módulo</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Nuevo Módulo</DialogTitle></DialogHeader>
            <form onSubmit={handleCreate} className="space-y-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Sistema *</Label>
                <Select value={form.sistema_id} onValueChange={(v) => setForm((f) => ({ ...f, sistema_id: v }))}>
                  <SelectTrigger data-testid="select-sistema"><SelectValue placeholder="Selecciona un sistema" /></SelectTrigger>
                  <SelectContent>{sistemas?.map((s) => <SelectItem key={s.id} value={String(s.id)}>{s.nombre}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Nombre *</Label>
                <Input value={form.nombre} onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))} required data-testid="input-nombre" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Descripción</Label>
                <Input value={form.descripcion} onChange={(e) => setForm((f) => ({ ...f, descripcion: e.target.value }))} />
              </div>
              <DialogFooter>
                <Button variant="outline" type="button" onClick={() => setOpen(false)}>Cancelar</Button>
                <Button type="submit" disabled={createModulo.isPending || !form.nombre || !form.sistema_id}>Crear</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex gap-2">
        <Select value={sistemaFilter} onValueChange={setSistemaFilter}>
          <SelectTrigger className="h-8 text-sm w-44" data-testid="select-sistema-filter">
            <SelectValue placeholder="Todos los sistemas" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los sistemas</SelectItem>
            {sistemas?.map((s) => <SelectItem key={s.id} value={String(s.id)}>{s.nombre}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-xs">Nombre</TableHead>
              <TableHead className="w-36 text-xs">Sistema</TableHead>
              <TableHead className="w-20 text-xs">Estado</TableHead>
              <TableHead className="w-20 text-xs">Tickets</TableHead>
              <TableHead className="w-10 text-xs"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <TableRow key={i}><TableCell colSpan={5}><Skeleton className="h-4" /></TableCell></TableRow>
              ))
            ) : modulos?.map((m) => (
              <TableRow key={m.id} data-testid={`row-modulo-${m.id}`}>
                <TableCell>
                  <p className="text-sm font-medium">{m.nombre}</p>
                  {m.descripcion && <p className="text-xs text-muted-foreground">{m.descripcion}</p>}
                </TableCell>
                <TableCell className="text-xs">{m.sistema_nombre}</TableCell>
                <TableCell>
                  <Badge variant={m.activo ? "default" : "secondary"} className="text-xs">{m.activo ? "Activo" : "Inactivo"}</Badge>
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">{m.total_tickets}</TableCell>
                <TableCell>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive"
                    data-testid={`button-delete-modulo-${m.id}`}
                    onClick={() => deleteModulo.mutate({ id: m.id }, {
                      onSuccess: () => qc.invalidateQueries({ queryKey: getListModulosQueryKey() }),
                    })}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {!isLoading && !modulos?.length && (
              <TableRow><TableCell colSpan={5} className="text-center text-sm text-muted-foreground py-8">Sin módulos</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
