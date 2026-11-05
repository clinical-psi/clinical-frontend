import { useState } from "react";
import { useAuth } from "../hooks/useAuth";
import type { LoginCredentials } from "../types/auth";
import { ForgotPasswordPage } from "./ForgotPasswordPage";
import { HttpError } from "../data/http/httpClient";
import "./LoginPage.css";

export function LoginPage() {
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);
  const [credentials, setCredentials] = useState<LoginCredentials>({
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [recovering, setRecovering] = useState(false);

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

    setLoading(true);
    try {
      await login(credentials);
    } catch (err) {
      setError(
        err instanceof HttpError && (err.status === 401 || err.status === 403)
          ? "Credenciales incorrectas. Verifica tu correo y contraseña."
          : err instanceof Error ? err.message : "Error al iniciar sesión",
      );
    } finally {
      setLoading(false);
    }
  };

  if (recovering) {
    return <ForgotPasswordPage onBack={() => setRecovering(false)} />;
  }

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

          {error && <div className="error-message" role="alert">{error}</div>}

          <button type="submit" disabled={loading} className="login-button">
            {loading ? "Iniciando sesión..." : "Iniciar Sesión"}
          </button>
          <div className="login-links">
            <button
              type="button"
              className="link-button"
              onClick={() => setRecovering(true)}
            >
              ¿Olvidaste tu contraseña?
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
