import { useState, type FormEvent } from "react";
import { useAuth } from "../hooks/useAuth";
import { authService } from "../services/authService";
import "./LoginPage.css";

export function ForcePasswordChangePage() {
  const { logout, markPasswordChanged } = useAuth();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");
    if (newPassword.length < 6) {
      setError("La nueva contraseña debe tener al menos 6 caracteres");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Las contraseñas no coinciden");
      return;
    }
    if (newPassword === currentPassword) {
      setError("La nueva contraseña debe ser distinta a la actual");
      return;
    }
    setLoading(true);
    try {
      await authService.changePassword(currentPassword, newPassword);
      markPasswordChanged();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "No se pudo cambiar la contraseña",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-container">
      <div className="login-box">
        <h1>Cambia tu contraseña</h1>
        <div className="info-message">
          Por seguridad, debes cambiar tu contraseña temporal antes de
          continuar.
        </div>
        {error && <div className="error-message">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="fc-current">Contraseña actual (temporal)</label>
            <input
              id="fc-current"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              disabled={loading}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="fc-new">Nueva contraseña</label>
            <input
              id="fc-new"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              disabled={loading}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="fc-confirm">Confirmar nueva contraseña</label>
            <input
              id="fc-confirm"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={loading}
              required
            />
          </div>
          <button type="submit" disabled={loading} aria-busy={loading} className="login-button">
            {loading ? "Guardando..." : "Cambiar contraseña"}
          </button>
          <div className="login-links">
            <button type="button" className="link-button" onClick={logout}>
              Cerrar sesión
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
