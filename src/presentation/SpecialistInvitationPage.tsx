import { useEffect, useState, type FormEvent } from "react";
import { Alert, Button, Container, Loader, Paper, PasswordInput, Stack, Text, Title } from "@mantine/core";
import { acceptSpecialistInvitation, previewSpecialistInvitation, type InvitationPreview } from "../data/http/authApi";
import { useAuth } from "../hooks/useAuth";

export function SpecialistInvitationPage({ token, onClose }: { token: string; onClose: () => void }) {
  const { logout } = useAuth();
  const [preview, setPreview] = useState<InvitationPreview | null>(null);
  const [loading, setLoading] = useState(true);
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [accepted, setAccepted] = useState(false);

  useEffect(() => {
    let cancelled = false;
    previewSpecialistInvitation(token)
      .then((response) => { if (!cancelled) setPreview(response); })
      .catch((requestError: Error) => { if (!cancelled) setError(requestError.message); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [token]);

  async function accept(event: FormEvent) {
    event.preventDefault();
    if (!preview || saving) return;
    if (!preview.existingAccount && password !== confirmation) {
      setError("Las contraseñas no coinciden.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await acceptSpecialistInvitation(token, password);
      setPassword("");
      setConfirmation("");
      setAccepted(true);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "No se pudo aceptar la invitación.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Container size="xs" py="xl">
      <Paper shadow="sm" p="lg" radius="md">
        <Stack>
          <Title order={2}>Invitación como especialista</Title>
          {loading ? <Loader /> : accepted ? (
            <Alert color="green" title="Acceso activado">
              La invitación fue aceptada. Inicia sesión con tu correo y contraseña para acceder a la clínica.
            </Alert>
          ) : (
            <>
              {error && <Alert color="red" title="No se pudo continuar">{error}</Alert>}
              {preview && <form onSubmit={accept}>
                <Stack>
                  <Text>Clínica: {preview.clinicName}</Text>
                  <Text>Cuenta: {preview.email}</Text>
                  <Text size="sm" c="dimmed">
                    {preview.existingAccount
                      ? "Ya tienes una cuenta. Confirma tu contraseña actual; no se cambiarán tu contraseña ni tus otros permisos."
                      : "Define una contraseña para tu nueva cuenta."}
                  </Text>
                  <PasswordInput label={preview.existingAccount ? "Contraseña actual" : "Nueva contraseña"}
                    autoComplete={preview.existingAccount ? "current-password" : "new-password"}
                    required minLength={6} maxLength={255} value={password}
                    onChange={(event) => setPassword(event.currentTarget.value)} />
                  {!preview.existingAccount && <PasswordInput label="Confirmar contraseña" required value={confirmation}
                    onChange={(event) => setConfirmation(event.currentTarget.value)} />}
                  <Button type="submit" loading={saving}>Aceptar invitación</Button>
                  {preview.existingAccount && <Text size="sm" c="dimmed">
                    Si olvidaste tu contraseña, vuelve al inicio y usa «¿Olvidaste tu contraseña?».
                    Después abre nuevamente el enlace de invitación.
                  </Text>}
                </Stack>
              </form>}
            </>
          )}
          <Button variant="default" disabled={saving} onClick={() => {
            if (accepted) logout();
            onClose();
          }}>{accepted ? "Ir a iniciar sesión" : "Volver al inicio"}</Button>
        </Stack>
      </Paper>
    </Container>
  );
}
