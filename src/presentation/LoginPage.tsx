import { useState } from "react";
import { useAuth } from "../hooks/useAuth";
import type { LoginCredentials, TenantChoice } from "../types/auth";
import { ForgotPasswordPage } from "./ForgotPasswordPage";
import { RegistrationPage } from "./RegistrationPage";
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
  const [registering, setRegistering] = useState(false);
  const [tenants, setTenants] = useState<TenantChoice[]>([]);
  const [tenantId, setTenantId] = useState("");

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
      const response = await login({ ...credentials, tenantId: tenantId ? Number(tenantId) : undefined });
      if ("tenants" in response && Array.isArray(response.tenants)) {
        setTenants(response.tenants);
        setTenantId("");
      }
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
  if (registering) return <RegistrationPage onBack={() => setRegistering(false)} />;

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
              readOnly={tenants.length > 0}
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

          {tenants.length > 0 && <div className="form-group">
            <label htmlFor="tenant">Clínica</label>
            <select id="tenant" required value={tenantId} disabled={loading}
              onChange={(event) => setTenantId(event.currentTarget.value)}>
              <option value="">Selecciona la clínica a la que deseas ingresar</option>
              {tenants.map((tenant) => <option key={tenant.tenantId} value={tenant.tenantId}>
                {tenant.tenantName}
              </option>)}
            </select>
            <button type="button" className="link-button" disabled={loading}
              onClick={() => { setTenants([]); setTenantId(""); }}>Usar otra cuenta</button>
          </div>}

          <button type="submit" disabled={loading} aria-busy={loading} className="login-button">
            {loading ? "Iniciando sesión..." : "Iniciar Sesión"}
          </button>
          <div className="login-links">
            <button type="button" className="link-button" onClick={() => setRegistering(true)}>
              Registrar mi clínica
            </button>
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
