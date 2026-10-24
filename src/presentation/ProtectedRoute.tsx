import type { ReactNode } from "react";
import { useAuth } from "../hooks/useAuth";
import { LoginPage } from "./LoginPage";
import { ForcePasswordChangePage } from "./ForcePasswordChangePage";

interface ProtectedRouteProps {
  children: ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, loading, user } = useAuth();

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
        }}
      >
        <p>Cargando...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  const isTenantAdmin =
    user?.roles?.some((role) => role.roleName === "TENANT_ADMIN") ?? false;
  if (user?.mustChangePassword && !isTenantAdmin) {
    return <ForcePasswordChangePage />;
  }

  return <>{children}</>;
}
