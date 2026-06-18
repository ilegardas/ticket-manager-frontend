import { useState } from "react";
import { useParams, useLocation } from "wouter";
import {
  useGetSistema, useUpdateSistema, useListModulos, useCreateModulo,
  useListDocumentos, useCreateDocumento, useDeleteDocumento,
  getGetSistemaQueryKey, getListModulosQueryKey, getListDocumentosQueryKey,
  getListSistemasQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";
import { ArrowLeft, Puzzle, FileText, Plus, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function SistemaDetail() {
  const { id } = useParams<{ id: string }>();
  const sistemaId = parseInt(id);
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [moduloOpen, setModuloOpen] = useState(false);
  const [docOpen, setDocOpen] = useState(false);
  const [moduloForm, setModuloForm] = useState({ nombre: "", descripcion: "" });
  const [docForm, setDocForm] = useState({ nombre: "", url: "", tipo_archivo: "pdf", descripcion: "" });

  const { data: sistema, isLoading } = useGetSistema(sistemaId, {
    query: { queryKey: getGetSistemaQueryKey(sistemaId), enabled: !!sistemaId },
  });
  const { data: modulos } = useListModulos({ sistema: sistemaId }, {
    query: { queryKey: getListModulosQueryKey({ sistema: sistemaId }), enabled: !!sistemaId },
  });
  const { data: documentos } = useListDocumentos({ sistema: sistemaId }, {
    query: { queryKey: getListDocumentosQueryKey({ sistema: sistemaId }), enabled: !!sistemaId },
  });

  const createModulo = useCreateModulo();
  const createDocumento = useCreateDocumento();
  const deleteDocumento = useDeleteDocumento();

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: getGetSistemaQueryKey(sistemaId) });
    qc.invalidateQueries({ queryKey: getListSistemasQueryKey() });
  };

  const handleCreateModulo = (e: React.FormEvent) => {
    e.preventDefault();
    createModulo.mutate({ data: { ...moduloForm, sistema_id: sistemaId } }, {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: getListModulosQueryKey({ sistema: sistemaId }) });
        invalidate();
        setModuloOpen(false);
        setModuloForm({ nombre: "", descripcion: "" });
        toast({ title: "Módulo creado" });
      },
    });
  };

  const handleCreateDocumento = (e: React.FormEvent) => {
    e.preventDefault();
    createDocumento.mutate({ data: { ...docForm, sistema_id: sistemaId } }, {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: getListDocumentosQueryKey({ sistema: sistemaId }) });
        setDocOpen(false);
        setDocForm({ nombre: "", url: "", tipo_archivo: "pdf", descripcion: "" });
        toast({ title: "Documento agregado" });
      },
    });
  };

  if (isLoading) return <div className="p-6"><Skeleton className="h-64 rounded-lg" /></div>;
  if (!sistema) return null;

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate("/sistemas")} data-testid="button-back">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-xl font-semibold">{sistema.nombre}</h1>
          {sistema.descripcion && <p className="text-sm text-muted-foreground">{sistema.descripcion}</p>}
        </div>
        <div className="ml-auto flex items-center gap-2">
          {sistema.version && <Badge variant="outline" className="text-xs">v{sistema.version}</Badge>}
          {sistema.proveedor && <Badge variant="secondary" className="text-xs">{sistema.proveedor}</Badge>}
          <Badge variant={sistema.activo ? "default" : "secondary"} className="text-xs">{sistema.activo ? "Activo" : "Inactivo"}</Badge>
        </div>
      </div>

      <Tabs defaultValue="modulos">
        <TabsList>
          <TabsTrigger value="modulos" className="text-xs">Módulos ({modulos?.length ?? 0})</TabsTrigger>
          <TabsTrigger value="documentos" className="text-xs">Documentos ({documentos?.length ?? 0})</TabsTrigger>
        </TabsList>

        <TabsContent value="modulos" className="mt-4">
          <div className="flex justify-end mb-3">
            <Dialog open={moduloOpen} onOpenChange={setModuloOpen}>
              <DialogTrigger asChild>
                <Button size="sm" data-testid="button-nuevo-modulo"><Plus className="h-3.5 w-3.5 mr-1.5" /> Módulo</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Nuevo Módulo</DialogTitle></DialogHeader>
                <form onSubmit={handleCreateModulo} className="space-y-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Nombre *</Label>
                    <Input value={moduloForm.nombre} onChange={(e) => setModuloForm((f) => ({ ...f, nombre: e.target.value }))} required data-testid="input-modulo-nombre" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Descripción</Label>
                    <Input value={moduloForm.descripcion} onChange={(e) => setModuloForm((f) => ({ ...f, descripcion: e.target.value }))} />
                  </div>
                  <DialogFooter>
                    <Button variant="outline" type="button" onClick={() => setModuloOpen(false)}>Cancelar</Button>
                    <Button type="submit" disabled={createModulo.isPending}>Crear</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {modulos?.map((m) => (
              <Card key={m.id} data-testid={`card-modulo-${m.id}`}>
                <CardContent className="pt-3 pb-3">
                  <div className="flex items-center gap-2">
                    <Puzzle className="h-4 w-4 text-primary shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{m.nombre}</p>
                      {m.descripcion && <p className="text-xs text-muted-foreground truncate">{m.descripcion}</p>}
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">{m.total_tickets} tickets</p>
                </CardContent>
              </Card>
            ))}
            {!modulos?.length && (
              <p className="text-sm text-muted-foreground col-span-3 text-center py-8">Sin módulos registrados</p>
            )}
          </div>
        </TabsContent>

        <TabsContent value="documentos" className="mt-4">
          <div className="flex justify-end mb-3">
            <Dialog open={docOpen} onOpenChange={setDocOpen}>
              <DialogTrigger asChild>
                <Button size="sm" data-testid="button-nuevo-documento"><Plus className="h-3.5 w-3.5 mr-1.5" /> Documento</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Agregar Documento</DialogTitle></DialogHeader>
                <form onSubmit={handleCreateDocumento} className="space-y-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Nombre *</Label>
                    <Input value={docForm.nombre} onChange={(e) => setDocForm((f) => ({ ...f, nombre: e.target.value }))} required />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">URL *</Label>
                    <Input type="url" value={docForm.url} onChange={(e) => setDocForm((f) => ({ ...f, url: e.target.value }))} required placeholder="https://" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs">Tipo de Archivo</Label>
                      <Input value={docForm.tipo_archivo} onChange={(e) => setDocForm((f) => ({ ...f, tipo_archivo: e.target.value }))} placeholder="pdf, xlsx..." />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Descripción</Label>
                      <Input value={docForm.descripcion} onChange={(e) => setDocForm((f) => ({ ...f, descripcion: e.target.value }))} />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" type="button" onClick={() => setDocOpen(false)}>Cancelar</Button>
                    <Button type="submit" disabled={createDocumento.isPending}>Agregar</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
          <div className="space-y-2">
            {documentos?.map((d) => (
              <Card key={d.id} data-testid={`card-doc-${d.id}`}>
                <CardContent className="py-3 flex items-center gap-3">
                  <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{d.nombre}</p>
                    {d.descripcion && <p className="text-xs text-muted-foreground">{d.descripcion}</p>}
                  </div>
                  <Badge variant="outline" className="text-xs uppercase">{d.tipo_archivo}</Badge>
                  <a href={d.url} target="_blank" rel="noopener noreferrer">
                    <Button variant="ghost" size="sm" className="text-xs">Ver</Button>
                  </a>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive"
                    onClick={() => deleteDocumento.mutate({ id: d.id }, {
                      onSuccess: () => qc.invalidateQueries({ queryKey: getListDocumentosQueryKey({ sistema: sistemaId }) }),
                    })}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </CardContent>
              </Card>
            ))}
            {!documentos?.length && (
              <p className="text-sm text-muted-foreground text-center py-8">Sin documentos registrados</p>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
