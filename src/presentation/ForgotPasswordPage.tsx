import { useState, type FormEvent } from "react";
import { authService } from "../services/authService";
import "./LoginPage.css";

type Step = "email" | "otp" | "password" | "done";

export function ForgotPasswordPage({ onBack }: { onBack: () => void }) {
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  async function run(action: () => Promise<void>, fallback: string) {
    setError("");
    setInfo("");
    setLoading(true);
    try {
      await action();
    } catch (err) {
      setError(err instanceof Error ? err.message : fallback);
    } finally {
      setLoading(false);
    }
  }

  function sendCode(event?: FormEvent) {
    event?.preventDefault();
    return run(async () => {
      await authService.forgotPassword(email.trim());
      setStep("otp");
      setOtp("");
      setInfo(`Enviamos un código de verificación a ${email.trim()}`);
    }, "No se pudo enviar el código");
  }

  function verifyCode(event: FormEvent) {
    event.preventDefault();
    return run(async () => {
      const response = await authService.verifyOtp(email.trim(), otp.trim());
      setResetToken(response.resetToken);
      setStep("password");
    }, "Código inválido o expirado");
  }

  function savePassword(event: FormEvent) {
    event.preventDefault();
    if (newPassword.length < 6) {
      setError("La nueva contraseña debe tener al menos 6 caracteres");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Las contraseñas no coinciden");
      return;
    }
    return run(async () => {
      await authService.resetPassword(email.trim(), resetToken, newPassword);
      setStep("done");
    }, "No se pudo restablecer la contraseña");
  }

  return (
    <div className="login-container">
      <div className="login-box">
        <h1>Recuperar contraseña</h1>

        {error && <div className="error-message">{error}</div>}
        {info && <div className="info-message">{info}</div>}

        {step === "email" && (
          <form onSubmit={sendCode}>
            <div className="form-group">
              <label htmlFor="fp-email">Correo Electrónico</label>
              <input
                id="fp-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@email.com"
                disabled={loading}
                required
              />
            </div>
            <button type="submit" disabled={loading} className="login-button">
              {loading ? "Enviando..." : "Enviar código"}
            </button>
          </form>
        )}

        {step === "otp" && (
          <form onSubmit={verifyCode}>
            <div className="form-group">
              <label htmlFor="fp-otp">Código de verificación</label>
              <input
                id="fp-otp"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="123456"
                disabled={loading}
                required
              />
            </div>
            <button type="submit" disabled={loading} className="login-button">
              {loading ? "Verificando..." : "Verificar código"}
            </button>
            <div className="login-links">
              <button
                type="button"
                className="link-button"
                disabled={loading}
                onClick={() => sendCode()}
              >
                Reenviar código
              </button>
            </div>
          </form>
        )}

        {step === "password" && (
          <form onSubmit={savePassword}>
            <div className="form-group">
              <label htmlFor="fp-new">Nueva contraseña</label>
              <input
                id="fp-new"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                disabled={loading}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="fp-confirm">Confirmar nueva contraseña</label>
              <input
                id="fp-confirm"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={loading}
                required
              />
            </div>
            <button type="submit" disabled={loading} className="login-button">
              {loading ? "Guardando..." : "Restablecer contraseña"}
            </button>
          </form>
        )}

        {step === "done" && (
          <>
            <div className="success-message">
              Tu contraseña fue actualizada. Ya puedes iniciar sesión.
            </div>
            <button className="login-button" onClick={onBack}>
              Ir a iniciar sesión
            </button>
          </>
        )}

        {step !== "done" && (
          <div className="login-links">
            <button type="button" className="link-button" onClick={onBack}>
              Volver a iniciar sesión
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
