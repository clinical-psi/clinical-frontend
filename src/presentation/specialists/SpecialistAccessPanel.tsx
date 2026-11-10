import { useEffect, useState } from "react";
import { Alert, Badge, Button, Group, Loader, Modal, Paper, Stack, Text, TextInput, Title } from "@mantine/core";
import { specialistService } from "../../services/specialistService";
import type { SpecialistAccess, SpecialistAccessAction, SpecialistAccessStatus } from "../../data/http/specialistsApi";
import { EMAIL_REGEX } from "../../util/constants";
import { useAuth } from "../../hooks/useAuth";
import { errorMessage, useConfirm, useToast } from "../../components/feedback/feedbackContext";

const ACCESS_LABELS: Record<SpecialistAccessStatus, string> = {
  NONE: "Sin acceso",
  PENDING: "Invitación pendiente",
  EXPIRED: "Invitación vencida",
  CANCELLED: "Invitación cancelada",
  ACTIVE: "Acceso activo",
  REVOKED: "Acceso revocado",
  ACCOUNT_DISABLED: "Cuenta desactivada",
};

const CONFIRMATIONS = {
  revoke: {
    title: "Revocar acceso de especialista",
    message: "Se retirará únicamente el rol de especialista en esta clínica. Sus citas e historial se conservarán. Su cuenta, los demás roles (incluido Administrador de Clínica) y el acceso a otras clínicas no cambiarán.",
    confirmLabel: "Revocar acceso",
  },
  cancel: {
    title: "Cancelar invitación",
    message: "El enlace dejará de permitir el acceso. El perfil del especialista y sus citas se conservarán.",
    confirmLabel: "Cancelar invitación",
  },
} as const;

const ACTION_MESSAGES: Record<SpecialistAccessAction, string> = {
  invite: "Invitación enviada satisfactoriamente",
  resend: "Invitación reenviada. El enlace anterior ya no es válido.",
  cancel: "Invitación cancelada",
  revoke: "Acceso como especialista revocado en esta clínica",
  restore: "Acceso como especialista restablecido",
};

export function SpecialistAccessPanel({
  specialistId, disabled,
}: {
  specialistId: string; disabled: boolean;
}) {
  const { user, refreshSession } = useAuth();
  const [access, setAccess] = useState<SpecialistAccess | null>(null);
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState<SpecialistAccessAction | null>(null);
  const [showAccount, setShowAccount] = useState(false);
  const toast = useToast();
  const confirm = useConfirm();
  const busy = pending !== null;
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    specialistService.getAccess(specialistId)
      .then((response) => {
        if (!cancelled) {
          setAccess(response);
          setEmail(response.email ?? "");
        }
      })
      .catch((requestError: Error) => { if (!cancelled) setError(requestError.message); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [specialistId, refreshKey]);

  async function run(action: SpecialistAccessAction) {
    setPending(action);
    try {
      const updated = await specialistService.changeAccess(specialistId, action, email.trim());
      setAccess(updated);
      if ((action === "revoke" || action === "restore") && user?.userId === updated.userId) {
        await refreshSession();
      }
      toast.success(ACTION_MESSAGES[action]);
    } finally {
      setPending(null);
    }
  }

  async function perform(action: SpecialistAccessAction) {
    if (busy) return;
    if (action === "invite" && !EMAIL_REGEX.test(email.trim())) {
      setError("Ingresa un correo electrónico válido para enviar la invitación.");
      return;
    }
    setError("");
    try {
      await run(action);
    } catch (requestError) {
      setError(errorMessage(requestError, "No se pudo actualizar el acceso."));
    }
  }

  function confirmAction(action: keyof typeof CONFIRMATIONS) {
    if (busy) return;
    setError("");
    void confirm({
      ...CONFIRMATIONS[action],
      cancelLabel: "Volver",
      destructive: true,
      onConfirm: () => run(action),
    });
  }

  const noAccess = access && ["NONE", "CANCELLED"].includes(access.status);
  const invitation = access && ["PENDING", "EXPIRED"].includes(access.status);
  const unavailable = busy || disabled || loading;

  return (
    <Paper withBorder p="md" radius="md">
      <Stack gap="sm">
        <Group justify="space-between">
          <Title order={4}>Acceso al sistema</Title>
          <Group>
          {access && <Badge variant="light" color={access.status === "ACTIVE" ? "green" : "gray"}>
            {ACCESS_LABELS[access.status]}
          </Badge>}
          <Button size="compact-sm" variant="subtle" disabled={unavailable} onClick={() => {
            setLoading(true);
            setError("");
            setRefreshKey((key) => key + 1);
          }}>Actualizar estado</Button>
          </Group>
        </Group>
        <Text size="sm" c="dimmed">
          El acceso a esta clínica es independiente de la cuenta y del estado de su agenda profesional.
        </Text>
        {loading && <Loader size="sm" />}
        {error && <Alert color="red" title="Error de acceso">{error}</Alert>}
        {noAccess && <>
          <TextInput label="Correo para la invitación" type="email" maxLength={255} value={email}
            disabled={unavailable} onChange={(event) => setEmail(event.currentTarget.value)} />
          <Text size="sm" c="dimmed">Si ya tiene una cuenta, podrá reutilizarla al aceptar.</Text>
          <Button variant="light" loading={pending === "invite"} disabled={unavailable} onClick={() => perform("invite")}>
            Invitar a acceder
          </Button>
        </>}
        {invitation && <>
          <Text size="sm">Invitación enviada a {access.email}</Text>
          {access.expiresAt && <Text size="sm" c="dimmed">
            Vencimiento: {new Date(access.expiresAt).toLocaleString("es-PE")}
          </Text>}
          <Group>
            <Button variant="light" loading={pending === "resend"} disabled={unavailable} onClick={() => perform("resend")}>Reenviar invitación</Button>
            <Button variant="default" disabled={unavailable} onClick={() => confirmAction("cancel")}>Cancelar invitación</Button>
          </Group>
        </>}
        {(access?.status === "ACTIVE" || access?.status === "REVOKED" || access?.status === "ACCOUNT_DISABLED") && <>
          <Text size="sm">Cuenta vinculada: {access.email}</Text>
          <Group>
            <Button variant="default" onClick={() => setShowAccount(true)}>Ver cuenta vinculada</Button>
            {access.status === "ACTIVE" && <Button color="red" variant="light" disabled={unavailable}
              onClick={() => confirmAction("revoke")}>Revocar acceso de especialista</Button>}
            {access.status === "REVOKED" && <Button variant="light" loading={pending === "restore"} disabled={unavailable}
              onClick={() => perform("restore")}>Restablecer acceso</Button>}
          </Group>
          {access.status === "ACCOUNT_DISABLED" && <Text size="sm" c="dimmed">
            La cuenta está desactivada. No se puede restablecer su acceso desde este perfil.
          </Text>}
        </>}
      </Stack>
      <Modal opened={showAccount} onClose={() => setShowAccount(false)} title="Cuenta vinculada">
        <Stack>
          <Text>Correo de acceso: {access?.email}</Text>
          <Text size="sm">Identificador de cuenta: {access?.userId}</Text>
          <Text size="sm" c="dimmed">
            Esta cuenta puede tener otros roles o pertenecer a otras clínicas. Las acciones de este panel solo afectan su acceso como especialista en esta clínica.
          </Text>
        </Stack>
      </Modal>
    </Paper>
  );
}
