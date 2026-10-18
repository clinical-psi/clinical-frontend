import { useState } from "react";
import { useAuth } from "../hooks/useAuth";
import type { LoginCredentials } from "../types/auth";
import "./LoginPage.css";

export function LoginPage() {
  const { login, loading } = useAuth();
  const [credentials, setCredentials] = useState<LoginCredentials>({
    email: "",
    password: "",
  });
  const [error, setError] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCredentials((prev) => ({
      ...prev,
      [name]: value,
    }));
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!credentials.email || !credentials.password) {
      setError("Por favor completa todos los campos");
      return;
    }

    try {
      await login(credentials);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al iniciar sesión");
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <h1>Sistema Clínico</h1>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">Correo Electrónico</label>
            <input
              type="email"
              id="email"
              name="email"
              value={credentials.email}
              onChange={handleChange}
              placeholder="tu@email.com"
              disabled={loading}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Contraseña</label>
            <input
              type="password"
              id="password"
              name="password"
              value={credentials.password}
              onChange={handleChange}
              placeholder="••••••••"
              disabled={loading}
              required
            />
          </div>

          {error && <div className="error-message">{error}</div>}

          <button type="submit" disabled={loading} className="login-button">
            {loading ? "Iniciando sesión..." : "Iniciar Sesión"}
          </button>
        </form>
      </div>
    </div>
  );
}
