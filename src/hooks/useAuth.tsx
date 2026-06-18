import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useLogin, useLogout, useGetMe, getGetMeQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";

interface AuthUser {
  id: number;
  correo_electronico: string;
  nombre_completo: string;
  rol?: string;
  token?: string | null;
}

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  login: (correo: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem("auth_token"));
  const qc = useQueryClient();
  const loginMutation = useLogin();
  const logoutMutation = useLogout();

  const { data: me, isLoading } = useGetMe({
    query: {
      queryKey: getGetMeQueryKey(),
      enabled: !!token,
      retry: false,
    },
    request: token ? { headers: { Authorization: `Bearer ${token}` } } : undefined,
  });

  const login = async (correo_electronico: string, password: string) => {
    const result = await loginMutation.mutateAsync({ data: { correo_electronico, password } });
    if (result.token) {
      localStorage.setItem("auth_token", result.token);
      setToken(result.token);
    }
    qc.invalidateQueries({ queryKey: getGetMeQueryKey() });
  };

  const logout = () => {
    logoutMutation.mutate(undefined);
    localStorage.removeItem("auth_token");
    setToken(null);
    qc.clear();
  };

  return (
    <AuthContext.Provider value={{ user: me ?? null, isLoading: isLoading && !!token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
