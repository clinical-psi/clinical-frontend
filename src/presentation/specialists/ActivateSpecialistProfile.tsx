import { useEffect, useState } from "react";
import { Alert, Button, Paper, Stack, Text, Title } from "@mantine/core";
import { useAuth } from "../../hooks/useAuth";
import { specialistService } from "../../services/specialistService";
import type { SelfSpecialist } from "../../data/http/specialistsApi";
import { errorMessage, useToast } from "../../components/feedback/feedbackContext";

export function ActivateSpecialistProfile({ onActivated }: { onActivated: () => void }) {
  const { refreshSession } = useAuth();
  const [profile, setProfile] = useState<SelfSpecialist | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const toast = useToast();

  useEffect(() => {
    let cancelled = false;
    specialistService.getSelfProfile()
      .then((response) => { if (!cancelled) setProfile(response); })
      .catch((requestError: Error) => { if (!cancelled) setError(requestError.message); });
    return () => { cancelled = true; };
  }, []);

  async function activate() {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      const response = await specialistService.activateSelf();
      await refreshSession();
      setProfile({ id: response.id, status: "ACTIVE" });
      toast.success("Tu perfil de especialista está activo");
      onActivated();
    } catch (requestError) {
      setError(errorMessage(requestError, "No se pudo activar tu perfil."));
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      {error && <Alert color="red" title="Perfil de especialista" mb="md">{error}</Alert>}
      {profile && (profile.status === "NONE" || profile.status === "REVOKED") && (
        <Paper withBorder p="md" radius="md" mb="lg">
          <Stack gap="sm">
            <Title order={4}>¿También atiendes pacientes?</Title>
            <Text size="sm" c="dimmed">
              Activa tu perfil profesional con tu cuenta actual, sin repetir tus datos ni perder tus permisos de administrador.
            </Text>
            <Button variant="light" loading={busy} onClick={activate}>Activar mi perfil de especialista</Button>
          </Stack>
        </Paper>
      )}
    </>
  );
}
