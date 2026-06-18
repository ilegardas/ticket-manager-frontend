import { useState } from "react";
import { useLocation } from "wouter";
import {
  useListSistemas, useCreateSistema, useDeleteSistema,
  getListSistemasQueryKey,
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
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";
import { Building2, Plus, Ticket, Puzzle, ChevronRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Sistemas() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ nombre: "", descripcion: "", version: "", proveedor: "" });

  const { data: sistemas, isLoading } = useListSistemas({
    query: { queryKey: getListSistemasQueryKey() },
  });
  const createSistema = useCreateSistema();

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    createSistema.mutate({ data: form }, {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: getListSistemasQueryKey() });
        setOpen(false);
        setForm({ nombre: "", descripcion: "", version: "", proveedor: "" });
        toast({ title: "Sistema creado" });
      },
      onError: () => toast({ title: "Error al crear sistema", variant: "destructive" }),
    });
  };

  return (
    <div className="p-6 space-y-4 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Sistemas</h1>
          <p className="text-sm text-muted-foreground">{sistemas?.length ?? 0} sistemas registrados</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" data-testid="button-nuevo-sistema">
              <Plus className="h-3.5 w-3.5 mr-1.5" /> Nuevo Sistema
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nuevo Sistema</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Nombre *</Label>
                <Input value={form.nombre} onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))} required data-testid="input-nombre" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Descripción</Label>
                <Textarea value={form.descripcion} onChange={(e) => setForm((f) => ({ ...f, descripcion: e.target.value }))} className="min-h-[70px]" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Versión</Label>
                  <Input value={form.version} onChange={(e) => setForm((f) => ({ ...f, version: e.target.value }))} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Proveedor</Label>
                  <Input value={form.proveedor} onChange={(e) => setForm((f) => ({ ...f, proveedor: e.target.value }))} />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" type="button" onClick={() => setOpen(false)}>Cancelar</Button>
                <Button type="submit" disabled={createSistema.isPending || !form.nombre}>Crear</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-36 rounded-lg" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {sistemas?.map((s) => (
            <Card key={s.id} className="cursor-pointer hover:border-primary/40 transition-colors"
              data-testid={`card-sistema-${s.id}`}
              onClick={() => navigate(`/sistemas/${s.id}`)}>
              <CardContent className="pt-4 pb-4">
                <div className="flex items-start justify-between">
                  <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
                    <Building2 className="h-4 w-4 text-primary" />
                  </div>
                  <Badge variant={s.activo ? "default" : "secondary"} className="text-xs">
                    {s.activo ? "Activo" : "Inactivo"}
                  </Badge>
                </div>
                <h3 className="font-semibold text-sm">{s.nombre}</h3>
                {s.descripcion && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{s.descripcion}</p>}
                {(s.version || s.proveedor) && (
                  <p className="text-xs text-muted-foreground mt-1">{[s.version, s.proveedor].filter(Boolean).join(" · ")}</p>
                )}
                <div className="flex items-center gap-4 mt-3 pt-3 border-t">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Ticket className="h-3 w-3" /> {s.total_tickets ?? 0} tickets
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Puzzle className="h-3 w-3" /> {s.total_modulos ?? 0} módulos
                  </div>
                  <ChevronRight className="h-3.5 w-3.5 text-muted-foreground ml-auto" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
