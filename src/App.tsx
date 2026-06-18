import { Switch, Route, Router as WouterRouter, useLocation, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import Layout from "@/components/Layout";
import NotFound from "@/pages/not-found";
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import TicketList from "@/pages/TicketList";
import TicketDetail from "@/pages/TicketDetail";
import TicketNew from "@/pages/TicketNew";
import Sistemas from "@/pages/Sistemas";
import SistemaDetail from "@/pages/SistemaDetail";
import Modulos from "@/pages/Modulos";
import Usuarios from "@/pages/Usuarios";
import Conocimiento from "@/pages/Conocimiento";
import Reportes from "@/pages/Reportes";
import Catalogos from "@/pages/Catalogos";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 0, retry: 1, refetchOnWindowFocus: true },
  },
});

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const [location] = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user && location !== "/auth/login") {
    return <Redirect to="/auth/login" />;
  }

  return <>{children}</>;
}

function Router() {
  return (
    <Switch>
      <Route path="/auth/login" component={Login} />
      <Route>
        <AuthGuard>
          <Layout>
            <Switch>
              <Route path="/" component={Dashboard} />
              <Route path="/tickets" component={TicketList} />
              <Route path="/tickets/nuevo" component={TicketNew} />
              <Route path="/tickets/:id" component={TicketDetail} />
              <Route path="/sistemas" component={Sistemas} />
              <Route path="/sistemas/:id" component={SistemaDetail} />
              <Route path="/modulos" component={Modulos} />
              <Route path="/usuarios" component={Usuarios} />
              <Route path="/conocimiento" component={Conocimiento} />
              <Route path="/reportes" component={Reportes} />
              <Route path="/admin/catalogos" component={Catalogos} />
              <Route component={NotFound} />
            </Switch>
          </Layout>
        </AuthGuard>
      </Route>
    </Switch>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
