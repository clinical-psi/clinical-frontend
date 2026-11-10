import { useState, type FormEvent } from "react";
import { Alert, Button, Paper, PasswordInput, Stack } from "@mantine/core";
import { authService } from "../../services/authService";
import { errorMessage, useToast } from "../../components/feedback/feedbackContext";

export function ChangePasswordForm() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const toast = useToast();

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;
    setError("");

    if (newPassword.length < 6) {
      setError("La nueva contraseña debe tener al menos 6 caracteres");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("La confirmación no coincide con la nueva contraseña");
      return;
    }

    setSaving(true);
    try {
      await authService.changePassword(currentPassword, newPassword);
      toast.success("Contraseña actualizada satisfactoriamente");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (requestError) {
      setError(errorMessage(requestError, "No se pudo cambiar la contraseña"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Paper shadow="sm" p="lg" radius="md" maw={480}>
      <form onSubmit={handleSubmit}>
        <Stack gap="md">
          {error && (
            <Alert color="red" title="Error">
              {error}
            </Alert>
          )}
          <PasswordInput
            label="Contraseña actual"
            required
            value={currentPassword}
            disabled={saving}
            onChange={(e) => setCurrentPassword(e.target.value)}
          />
          <PasswordInput
            label="Nueva contraseña"
            required
            value={newPassword}
            disabled={saving}
            onChange={(e) => setNewPassword(e.target.value)}
          />
          <PasswordInput
            label="Confirmar nueva contraseña"
            required
            value={confirmPassword}
            disabled={saving}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
          <Button type="submit" loading={saving}>
            Cambiar contraseña
          </Button>
        </Stack>
      </form>
    </Paper>
  );
}
