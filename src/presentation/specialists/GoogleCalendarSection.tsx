import { Alert, Button, Group, Stack, Text, Title } from "@mantine/core";
import { useCallback, useEffect, useRef, useState } from "react";
import { useConfirm, useToast } from "../../components/feedback/feedbackContext";
import type { GoogleCalendarConnection } from "../../data/http/specialistsApi";
import { specialistService } from "../../services/specialistService";

const POPUP_POLL_MS = 500;
const SYNC_REFRESH_MS = 3000;

function formatDateTime(value: string | null) {
  return value
    ? new Date(value).toLocaleString("es-PE", { dateStyle: "medium", timeStyle: "short" })
    : "—";
}

export function GoogleCalendarSection({ specialistId }: { specialistId: string }) {
  const [connection, setConnection] = useState<GoogleCalendarConnection | null>(null);
  const [error, setError] = useState("");
  const [connecting, setConnecting] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const toast = useToast();
  const confirm = useConfirm();
  const pollRef = useRef<number | undefined>(undefined);

  const load = useCallback(async () => {
    try {
      setConnection(await specialistService.getGoogleCalendar(specialistId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo cargar Google Calendar.");
    }
  }, [specialistId]);

  useEffect(() => {
    let cancelled = false;
    specialistService.getGoogleCalendar(specialistId)
      .then((data) => { if (!cancelled) setConnection(data); })
      .catch((err: Error) => { if (!cancelled) setError(err.message); });
    return () => {
      cancelled = true;
      window.clearInterval(pollRef.current);
    };
  }, [specialistId]);

  async function connect() {
    if (connecting) return;
    // La ventana se abre en el click para que el navegador no la bloquee.
    const popup = window.open("", "google-calendar", "width=520,height=640");
    setConnecting(true);
    setError("");
    try {
      const { authorizationUrl } = await specialistService.startGoogleCalendarAuthorization(specialistId);
      if (!popup) {
        window.location.assign(authorizationUrl);
        return;
      }
      popup.location.href = authorizationUrl;
      window.clearInterval(pollRef.current);
      pollRef.current = window.setInterval(() => {
        if (!popup.closed) return;
        window.clearInterval(pollRef.current);
        setConnecting(false);
        void load();
      }, POPUP_POLL_MS);
    } catch (err) {
      popup?.close();
      setConnecting(false);
      setError(err instanceof Error ? err.message : "No se pudo iniciar la conexión.");
    }
  }

  async function sync() {
    if (syncing) return;
    setSyncing(true);
    setError("");
    try {
      await specialistService.syncGoogleCalendar(specialistId);
      toast.success("Sincronización con Google Calendar iniciada");
      window.setTimeout(() => void load(), SYNC_REFRESH_MS);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo sincronizar.");
    } finally {
      setSyncing(false);
    }
  }

  async function disconnect() {
    await confirm({
      title: "¿Desconectar Google Calendar?",
      message: "Las nuevas citas dejarán de enviarse a Google Calendar. Los eventos ya creados permanecerán en el calendario de Google.",
      confirmLabel: "Desconectar",
      destructive: true,
      onConfirm: async () => {
        await specialistService.disconnectGoogleCalendar(specialistId);
        toast.success("Google Calendar desconectado satisfactoriamente");
        await load();
      },
    });
  }

  const status = connection?.status ?? "DISCONNECTED";
  const connectButton = (label: string) => (
    <Button
      onClick={() => void connect()}
      loading={connecting}
      disabled={!connection}
      w={{ base: "100%", sm: 320 }}
    >
      {label}
    </Button>
  );

  return (
    <Stack gap="xs">
      <Title order={4}>Google Calendar</Title>
      <Text size="sm" c="dimmed">
        Envía automáticamente las citas de este especialista a un calendario exclusivo de citas en
        su Google Calendar. La aplicación no ve ni modifica sus otros calendarios. Los cambios se
        hacen siempre desde esta aplicación.
      </Text>

      {connection && !connection.available && (
        <Text size="sm" c="dimmed">
          La integración con Google Calendar no está habilitada en este entorno.
        </Text>
      )}

      {connection?.available && status === "DISCONNECTED" && connectButton("Conectar Google Calendar")}

      {connection?.available && status !== "DISCONNECTED" && (
        <>
          <Text size="sm">
            Cuenta conectada: <b>{connection.googleEmail ?? "—"}</b>
          </Text>
          {connection.calendarName && (
            <Text size="sm">
              Calendario: <b>{connection.calendarName}</b>
            </Text>
          )}
          <Text size="sm" c="dimmed">
            Última sincronización: {formatDateTime(connection.lastSyncedAt)}
          </Text>
          {connection.lastSyncError && <Alert color="red">{connection.lastSyncError}</Alert>}
          <Group gap="sm">
            {status === "NEEDS_RECONNECT" ? (
              connectButton("Reconectar Google Calendar")
            ) : (
              <Button variant="light" onClick={() => void sync()} loading={syncing}>
                Sincronizar ahora
              </Button>
            )}
            <Button variant="subtle" color="red" onClick={() => void disconnect()}>
              Desconectar
            </Button>
          </Group>
        </>
      )}

      {error && <Alert color="red">{error}</Alert>}
    </Stack>
  );
}
