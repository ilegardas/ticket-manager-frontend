import { useState } from "react";
import {
  useListUsuarios, useCreateUsuario, useUpdateUsuario, useDeleteUsuario,
  getListUsuariosQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";
import { Plus, Search, Trash2, Pencil } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const ROL_LABELS: Record<string, string> = { admin: "Admin", tecnico: "Técnico", usuario: "Usuario" };
const ROL_COLORS: Record<string, string> = { admin: "text-violet-600 border-violet-300", tecnico: "text-blue-600 border-blue-300", usuario: "" };

const EMPTY_FORM = {
  correo_electronico: "", nombre_completo: "", password: "", rol: "usuario",
  numero_empleado: "", puesto_cargo: "", cct: "", region_zona: "", nivel_educativo: "",
};

export default function Usuarios() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [rolFilter, setRolFilter] = useState("all");
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [activo, setActivo] = useState(true);
  const [form, setForm] = useState({ ...EMPTY_FORM });

  const params = {
    search: search || undefined,
  };
  const { data: usuarios, isLoading } = useListUsuarios(params, {
    query: { queryKey: getListUsuariosQueryKey(params) },
  });
  const createUsuario = useCreateUsuario();
  const updateUsuario = useUpdateUsuario();
  const deleteUsuario = useDeleteUsuario();

  const filtered = usuarios?.filter((u) => rolFilter === "all" || u.rol === rolFilter) ?? [];

  const openCreate = () => {
    setEditId(null);
    setActivo(true);
    setForm({ ...EMPTY_FORM });
    setOpen(true);
  };

  const openEdit = (u: NonNullable<typeof usuarios>[number]) => {
    setEditId(u.id);
    setActivo(u.activo ?? true);
    setForm({
      correo_electronico: u.correo_electronico,
      nombre_completo: u.nombre_completo,
      password: "",
      rol: u.rol ?? "usuario",
      numero_empleado: u.numero_empleado ?? "",
      puesto_cargo: u.puesto_cargo ?? "",
      cct: u.cct ?? "",
      region_zona: u.region_zona ?? "",
      nivel_educativo: u.nivel_educativo ?? "",
    });
    setOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editId != null) {
      updateUsuario.mutate({
        id: editId,
        data: {
          nombre_completo: form.nombre_completo,
          rol: form.rol,
          numero_empleado: form.numero_empleado || undefined,
          puesto_cargo: form.puesto_cargo || undefined,
          cct: form.cct || undefined,
          region_zona: form.region_zona || undefined,
          nivel_educativo: form.nivel_educativo || undefined,
          activo,
        },
      }, {
        onSuccess: () => {
          qc.invalidateQueries({ queryKey: getListUsuariosQueryKey() });
          setOpen(false);
          toast({ title: "Usuario actualizado" });
        },
        onError: () => toast({ title: "Error al actualizar usuario", variant: "destructive" }),
      });
    } else {
      createUsuario.mutate({ data: form }, {
        onSuccess: () => {
          qc.invalidateQueries({ queryKey: getListUsuariosQueryKey() });
          setOpen(false);
          setForm({ ...EMPTY_FORM });
          toast({ title: "Usuario creado" });
        },
        onError: () => toast({ title: "Error al crear usuario", variant: "destructive" }),
      });
    }
  };

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));
  const isEdit = editId != null;
  const pending = createUsuario.isPending || updateUsuario.isPending;

  return (
    <div className="p-6 space-y-4 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Usuarios</h1>
          <p className="text-sm text-muted-foreground">{usuarios?.length ?? 0} usuarios registrados</p>
        </div>
        <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) setEditId(null); }}>
          <DialogTrigger asChild>
            <Button size="sm" data-testid="button-nuevo-usuario" onClick={openCreate}><Plus className="h-3.5 w-3.5 mr-1.5" /> Nuevo Usuario</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>{isEdit ? "Editar Usuario" : "Nuevo Usuario"}</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5 col-span-2">
                  <Label className="text-xs">Nombre Completo *</Label>
                  <Input value={form.nombre_completo} onChange={(e) => set("nombre_completo", e.target.value)} required data-testid="input-nombre" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Correo Electrónico *</Label>
                  <Input type="email" value={form.correo_electronico} onChange={(e) => set("correo_electronico", e.target.value)} required disabled={isEdit} data-testid="input-correo" />
                </div>
                {!isEdit && (
                  <div className="space-y-1.5">
                    <Label className="text-xs">Contraseña *</Label>
                    <Input type="password" value={form.password} onChange={(e) => set("password", e.target.value)} required data-testid="input-password" />
                  </div>
                )}
                <div className="space-y-1.5">
                  <Label className="text-xs">Rol</Label>
                  <Select value={form.rol} onValueChange={(v) => set("rol", v)}>
                    <SelectTrigger data-testid="select-rol"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Administrador</SelectItem>
                      <SelectItem value="tecnico">Técnico</SelectItem>
                      <SelectItem value="usuario">Usuario</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {isEdit && (
                  <div className="space-y-1.5">
                    <Label className="text-xs">Estado</Label>
                    <Select value={activo ? "activo" : "inactivo"} onValueChange={(v) => setActivo(v === "activo")}>
                      <SelectTrigger data-testid="select-activo"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="activo">Activo</SelectItem>
                        <SelectItem value="inactivo">Inactivo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <div className="space-y-1.5">
                  <Label className="text-xs">Número de Empleado</Label>
                  <Input value={form.numero_empleado} onChange={(e) => set("numero_empleado", e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Puesto / Cargo</Label>
                  <Input value={form.puesto_cargo} onChange={(e) => set("puesto_cargo", e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">CCT</Label>
                  <Input value={form.cct} onChange={(e) => set("cct", e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Región / Zona</Label>
                  <Input value={form.region_zona} onChange={(e) => set("region_zona", e.target.value)} />
                </div>
                <div className="space-y-1.5 col-span-2">
                  <Label className="text-xs">Nivel Educativo</Label>
                  <Input value={form.nivel_educativo} onChange={(e) => set("nivel_educativo", e.target.value)} placeholder="Primaria, Secundaria, Preparatoria..." />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" type="button" onClick={() => setOpen(false)}>Cancelar</Button>
                <Button type="submit" disabled={pending}>{isEdit ? "Guardar" : "Crear"}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex gap-2 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input placeholder="Buscar nombre, correo..." className="pl-8 h-8 text-sm" value={search} onChange={(e) => setSearch(e.target.value)} data-testid="input-search" />
        </div>
        <Select value={rolFilter} onValueChange={setRolFilter}>
          <SelectTrigger className="h-8 text-sm w-32" data-testid="select-rol-filter"><SelectValue placeholder="Rol" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
            <SelectItem value="tecnico">Técnico</SelectItem>
            <SelectItem value="usuario">Usuario</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-xs">Usuario</TableHead>
              <TableHead className="w-24 text-xs">Rol</TableHead>
              <TableHead className="w-28 text-xs">Emp.</TableHead>
              <TableHead className="w-36 text-xs">Región</TableHead>
              <TableHead className="w-32 text-xs">Nivel Educativo</TableHead>
              <TableHead className="w-16 text-xs">Estado</TableHead>
              <TableHead className="w-20"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}><TableCell colSpan={7}><Skeleton className="h-4" /></TableCell></TableRow>
              ))
            ) : filtered.map((u) => (
              <TableRow key={u.id} data-testid={`row-usuario-${u.id}`}>
                <TableCell>
                  <div className="flex items-center gap-2.5">
                    <Avatar className="h-7 w-7 text-xs">
                      <AvatarFallback className="text-xs bg-primary/10 text-primary">
                        {u.nombre_completo.split(" ").slice(0, 2).map((n) => n[0]).join("").toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">{u.nombre_completo}</p>
                      <p className="text-xs text-muted-foreground">{u.correo_electronico}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className={`text-xs ${u.rol ? ROL_COLORS[u.rol] ?? "" : ""}`}>{u.rol ? ROL_LABELS[u.rol] ?? u.rol : "—"}</Badge>
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">{u.numero_empleado ?? "—"}</TableCell>
                <TableCell className="text-xs text-muted-foreground">{u.region_zona ?? "—"}</TableCell>
                <TableCell className="text-xs text-muted-foreground">{u.nivel_educativo ?? "—"}</TableCell>
                <TableCell>
                  <Badge variant={u.activo ? "default" : "secondary"} className="text-xs">{u.activo ? "Activo" : "Inactivo"}</Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-0.5">
                    <Button variant="ghost" size="icon" className="h-7 w-7"
                      data-testid={`button-edit-usuario-${u.id}`}
                      onClick={() => openEdit(u)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive"
                      data-testid={`button-delete-usuario-${u.id}`}
                      onClick={() => deleteUsuario.mutate({ id: u.id }, {
                        onSuccess: () => qc.invalidateQueries({ queryKey: getListUsuariosQueryKey() }),
                      })}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {!isLoading && !filtered.length && (
              <TableRow><TableCell colSpan={7} className="text-center text-sm text-muted-foreground py-8">Sin usuarios</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
