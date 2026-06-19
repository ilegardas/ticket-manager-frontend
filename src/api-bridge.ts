import { useQuery, useMutation } from '@tanstack/react-query';

// ⚠️ Recuerda ajustar tu URL real del Backend de Railway
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

// 2. Base dinámica para las peticiones interceptadas
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

// 3. EXPORTACIONES EXPLÍCITAS (Dashboard & Reportes)
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

// 4. EXPORTACIONES EXPLÍCITAS (TicketList & Catálogos exigidos ahora)
export const useListTickets = (options?: any) => proxy.useListTickets(options);
export const useRemindTicket = () => proxy.useRemindTicket();
export const useListEstados = (options?: any) => proxy.useListEstados(options);
export const useListPrioridades = (options?: any) => proxy.useListPrioridades(options);
export const useListSistemas = (options?: any) => proxy.useListSistemas(options);
export const useListCategorias = (options?: any) => proxy.useListCategorias(options);

export const getListTicketsQueryKey = () => ['useListTickets'];
export const getListEstadosQueryKey = () => ['useListEstados'];
export const getListPrioridadesQueryKey = () => ['useListPrioridades'];
export const getListSistemasQueryKey = () => ['useListSistemas'];
export const getListCategoriasQueryKey = () => ['useListCategorias'];

// Operaciones comunes individuales de soporte
export const useGetTickets = (options?: any) => proxy.useGetTickets(options);
export const useCreateTicket = () => proxy.useCreateTicket();
export const useUpdateTicketStatus = () => proxy.useUpdateTicketStatus();

export default proxy;
