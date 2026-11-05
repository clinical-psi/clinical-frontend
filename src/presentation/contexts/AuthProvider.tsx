import { useState, useEffect } from "react";
import type { ReactNode } from "react";
import type {
  AuthContextType,
  AuthResponse,
  LoginCredentials,
} from "../../types/auth";
import { AuthContext } from "./AuthContext";
import { authService } from "../../services/authService";
import { SESSION_EXPIRED_EVENT } from "../../data/http/httpClient";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Verificar si el usuario ya está autenticado al cargar la aplicación
  useEffect(() => {
    const storedUser = authService.getUser();
    const token = authService.getToken();

    if (storedUser && token) {
      setUser(storedUser);
      setIsAuthenticated(true);
    }

    setLoading(false);
  }, []);

  const login = async (credentials: LoginCredentials) => {
    const response = await authService.login(credentials);
    setUser(response);
    setIsAuthenticated(true);
  };

  const logout = () => {
    authService.logout();
    setUser(null);
    setIsAuthenticated(false);
  };

  const markPasswordChanged = () => {
    const updated = authService.clearMustChangePassword();
    if (updated) setUser(updated);
  };

  useEffect(() => {
    const handleExpired = () => {
      authService.logout();
      setUser(null);
      setIsAuthenticated(false);
    };
    window.addEventListener(SESSION_EXPIRED_EVENT, handleExpired);
    return () =>
      window.removeEventListener(SESSION_EXPIRED_EVENT, handleExpired);
  }, []);

  const value: AuthContextType = {
    isAuthenticated,
    user,
    loading,
    login,
    logout,
    markPasswordChanged,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
