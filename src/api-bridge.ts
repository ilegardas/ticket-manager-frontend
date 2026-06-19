import { useQuery, useMutation } from '@tanstack/react-query';

// Enlace real de producción de tu backend en Railway
const BACKEND_URL = "https://ticket-manager-production-9d0b.up.railway.app";

const fetcher = async (endpoint: string, options: any = {}) => {
  const token = localStorage.getItem('auth_token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...options.headers
  };
  const res = await fetch(BACKEND_URL + endpoint, { ...options, headers });
  if (!res.ok) throw new Error('API Error status: ' + res.status);
  return res.json();
};

export const setAuthTokenGetter = () => {};
export const api = {};

// 1. Autenticación Básica Explícita
export const useLogin = () => useMutation({
  mutationFn: (data) => fetcher('/api/auth/login', { method: 'POST', body: JSON.stringify(data) })
});
export const useLogout = () => useMutation({
  mutationFn: () => fetcher('/api/auth/logout', { method: 'POST' })
});
export const useGetMe = () => useQuery({
  queryKey: ['getMe'],
  queryFn: () => fetcher('/api/auth/me').catch(() => null)
});
export const getGetMeQueryKey = () => ['getMe'];

// 2. Base dinámica para las peticiones interceptadas (Proxy)
const dummyFn = () => ({ data: null, isLoading: false, mutate: () => {} });
const proxyHandler = {
  get: (target: any, prop: string) => {
    if (prop.endsWith('QueryKey')) {
      return () => [prop];
    }
    if (prop.startsWith('useGet') || prop.startsWith('useList')) {
      const endpoint = '/api/' + prop.replace('useGet', '').replace('useList', '').toLowerCase();
      return (options: any) => useQuery({
        queryKey: [prop, options],
        queryFn: () => fetcher(endpoint)
      });
    }
    if (prop.startsWith('use')) {
      const endpoint = '/api/' + prop.replace('use', '').toLowerCase();
      return () => useMutation({
        mutationFn: (data) => fetcher(endpoint, { method: 'POST', body: JSON.stringify(data) })
      });
    }
    return dummyFn;
  }
};
const proxy = new Proxy({}, proxyHandler);

// 3. Dashboard & Reportes
export const useGetReporteResumen = (options?: any) => proxy.useGetReporteResumen(options);
export const useGetActividadReciente = (options?: any) => proxy.useGetActividadReciente(options);
export const useGetReportePorEstado = (options?: any) => proxy.useGetReportePorEstado(options);
export const useGetReportePorSistema = (options?: any) => proxy.useGetReportePorSistema(options);
export const useGetReporteTendencias = (options?: any) => proxy.useGetReporteTendencias(options);

export const getGetReporteResumenQueryKey = () => ['useGetReporteResumen'];
export const getGetActividadRecienteQueryKey = () => ['useGetActividadReciente'];
export const getGetReportePorEstadoQueryKey = () => ['useGetReportePorEstado'];
export const getGetReportePorSistemaQueryKey = () => ['useGetReportePorSistema'];
export const getGetReporteTendenciasQueryKey = () => ['useGetReporteTendencias'];

// Reportes detallados adicionales (Exigidos por ReporteTickets.tsx)
export const useGetReporteTickets = (options?: any) => proxy.useGetReporteTickets(options);
export const getGetReporteTicketsQueryKey = (options?: any) => ['useGetReporteTickets', options];

// 4. TicketList & Catálogos (Consultas)
export const useListTickets = (options?: any) => proxy.useListTickets(options);
export const useRemindTicket = () => proxy.useRemindTicket();
export const useListEstados = (options?: any) => proxy.useListEstados(options);
export const useListPrioridades = (options?: any) => proxy.useListPrioridades(options);
export const useListSistemas = (options?: any) => proxy.useListSistemas(options);
export const useListCategorias = (options?: any) => proxy.useListCategorias(options);
export const useListModulos = (options?: any) => proxy.useListModulos(options);
export const useListUsuarios = (options?: any) => proxy.useListUsuarios(options);

export const getListTicketsQueryKey = () => ['useListTickets'];
export const getListEstadosQueryKey = () => ['useListEstados'];
export const getListPrioridadesQueryKey = () => ['useListPrioridades'];
export const getListSistemasQueryKey = () => ['useListSistemas'];
export const getListCategoriasQueryKey = () => ['useListCategorias'];
export const getListModulosQueryKey = () => ['useListModulos'];
export const getListUsuariosQueryKey = () => ['useListUsuarios'];

// 5. TicketDetail, Chatter y Tiempos
export const useGetTicket = (id: any) => proxy.useGetTicket(id);
export const useUpdateTicket = () => proxy.useUpdateTicket();
export const useDeleteTicket = () => proxy.useDeleteTicket();
export const useListChatter = (id: any) => proxy.useListChatter(id);
export const useAddChatter = () => proxy.useAddChatter();
export const useListTimeLogs = (id: any) => proxy.useListTimeLogs(id);
export const useReopenTicket = () => proxy.useReopenTicket();

export const getGetTicketQueryKey = (id: any) => ['useGetTicket', id];
export const getListChatterQueryKey = (id: any) => ['useListChatter', id];
export const getListTimeLogsQueryKey = (id: any) => ['useListTimeLogs', id];

// 6. Catálogos Avanzados (Sistemas en detalle y Documentación)
export const useGetSistema = (id: any) => proxy.useGetSistema(id);
export const useUpdateSistema = () => proxy.useUpdateSistema();
export const useListDocumentos = (options?: any) => proxy.useListDocumentos(options);
export const useCreateDocumento = () => proxy.useCreateDocumento();
export const useDeleteDocumento = () => proxy.useDeleteDocumento();

export const getGetSistemaQueryKey = (id: any) => ['useGetSistema', id];
export const getListDocumentosQueryKey = (options?: any) => ['useListDocumentos', options];

// 7. Base de Conocimiento
export const useListConocimiento = (options?: any) => proxy.useListConocimiento(options);
export const useCreateConocimiento = () => proxy.useCreateConocimiento();
export const useGetConocimiento = (id: any) => proxy.useGetConocimiento(id);
export const useDeleteConocimiento = () => proxy.useDeleteConocimiento();

export const getListConocimientoQueryKey = (options?: any) => ['useListConocimiento', options];
export const getGetConocimientoQueryKey = (id: any) => ['useGetConocimiento', id];

// 8. Acciones de Configuración (CRUD de Catálogos Básicos)
export const useCreateSistema = () => proxy.useCreateSistema();
export const useDeleteSistema = () => proxy.useDeleteSistema();
export const useCreateModulo = () => proxy.useCreateModulo();
export const useDeleteModulo = () => proxy.useDeleteModulo();
export const useCreateCategoria = () => proxy.useCreateCategoria();
export const useDeleteCategoria = () => proxy.useDeleteCategoria();
export const proxyDeleteCategoria = () => proxy.useDeleteCategoria();
export const useCreateEstado = () => proxy.useCreateEstado();
export const useDeleteEstado = () => proxy.useDeleteEstado();
export const useCreatePrioridad = () => proxy.useCreatePrioridad();
export const useDeletePrioridad = () => proxy.useDeletePrioridad();

// 9. CRUD de Usuarios
export const useCreateUsuario = () => proxy.useCreateUsuario();
export const useUpdateUsuario = () => proxy.useUpdateUsuario();
export const useDeleteUsuario = () => proxy.useDeleteUsuario();

// 10. Métodos Globales Adicionales y fallbacks para vistas secundarias
export const useGetTickets = (options?: any) => proxy.useGetTickets(options);
export const useCreateTicket = () => proxy.useCreateTicket();
export const useUpdateTicketStatus = () => proxy.useUpdateTicketStatus();

export const useCreatePrioridades = () => proxy.useCreatePrioridad();
export const useDeletePrioridades = () => proxy.useDeletePrioridad();
export const useCreateCategorias = () => proxy.useCreateCategoria();
export const useDeleteCategorias = () => proxy.useDeleteCategoria();
export const useCreateEstados = () => proxy.useCreateEstado();
export const useDeleteEstados = () => proxy.useDeleteEstado();

export default proxy;
