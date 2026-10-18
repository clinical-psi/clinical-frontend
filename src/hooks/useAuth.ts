import { useContext } from "react";
import { AuthContext } from "../presentation/contexts/AuthContext";

export function useAuth() {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error("useAuth debe ser utilizado dentro de un AuthProvider");
  }

  return context;
}
