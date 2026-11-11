import { useEffect, useState } from "react";
import {
  Accordion,
  Alert,
  Badge,
  Group,
  Loader,
  Modal,
  Select,
  Stack,
  Text,
  Textarea,
  Button,
} from "@mantine/core";
import { ModalActions } from "../../components/feedback/ModalActions";
import { appointmentService } from "../../services/appointmentService";
import { formatAppointmentDateTime } from "../../util/utils";
import type { AppointmentViewModalProps } from "./AppointmentsPage";
import { formatLocationLabel } from "../../data/http/locationsApi";
import {
  errorMessage,
  useConfirm,
  useToast,
} from "../../components/feedback/feedbackContext";
import type {
  AppointmentAction,
  AppointmentHistory,
  AppointmentTransition,
  CancellationReason,
  CancellationRequester,
} from "../../data/http/appointmentsApi";
import {
  APPOINTMENT_STATUSES,
  CANCELLATION_REASONS,
  CANCELLATION_REQUESTERS,
} from "./appointmentStatus";

export function AppointmentViewModal({
  appointment,
  onClose,
  onEdit,
  onChanged,
}: AppointmentViewModalProps) {
  const confirm = useConfirm();
  const toast = useToast();
  const [saving, setSaving] = useState(false);
  const [formAction, setFormAction] = useState<
    "CANCEL" | "COMPLETE" | "NO_SHOW" | null
  >(null);
  const [reasonCode, setReasonCode] = useState<CancellationReason | null>(null);
  const [requestedBy, setRequestedBy] = useState<CancellationRequester | null>(
    null,
  );
  const [note, setNote] = useState("");
  const [formError, setFormError] = useState("");
  const [history, setHistory] = useState<{
    key: string;
    entries: AppointmentHistory[];
    error: string;
  }>({
    key: "",
    entries: [],
    error: "",
  });
  const [retry, setRetry] = useState(0);
  const historyKey = `${appointment.id}|${appointment.status}|${retry}`;
  const actions = appointment.allowedActions;
  const status = APPOINTMENT_STATUSES[appointment.status];
  const correction =
    appointment.status === "COMPLETED" || appointment.status === "NO_SHOW";
  const lastChange =
    history.key === historyKey ? history.entries[0] : undefined;
  const currencySymbol: Record<string, string> = {
    USD: "$ ",
    PEN: "S/ ",
  };
  useEffect(() => {
    let active = true;
    appointmentService
      .history(appointment.id)
      .then((entries) => {
        if (active) setHistory({ key: historyKey, entries, error: "" });
      })
      .catch((err: unknown) => {
        if (active)
          setHistory({
            key: historyKey,
            entries: [],
            error: errorMessage(err, "No se pudo cargar el historial."),
          });
      });
    return () => {
      active = false;
    };
  }, [appointment.id, historyKey]);

  const execute = async (
    action: Exclude<AppointmentAction, "EDIT">,
    payload: AppointmentTransition = {},
  ) => {
    if (saving) return;
    setSaving(true);
    try {
      const updated = await appointmentService.transition(
        appointment.id,
        action,
        payload,
      );
      onChanged(updated);
      toast.success(
        action === "CANCEL"
          ? "Cita cancelada satisfactoriamente"
          : "Estado de la cita actualizado satisfactoriamente",
      );
      setFormAction(null);
      if (action === "CANCEL") onClose();
    } finally {
      setSaving(false);
    }
  };

  const requestAction = (action: Exclude<AppointmentAction, "EDIT">) => {
    if (saving) return;
    if (action === "CANCEL" || correction) {
      setReasonCode(null);
      setRequestedBy(null);
      setNote("");
      setFormError("");
      setFormAction(
        action === "CANCEL"
          ? action
          : action === "COMPLETE"
            ? "COMPLETE"
            : "NO_SHOW",
      );
      return;
    }
    const labels = {
      CONFIRM: "Confirmar asistencia",
      COMPLETE: "Marcar como atendida",
      NO_SHOW: "Marcar como no asistió",
      CANCEL: "Cancelar cita",
    };
    void confirm({
      title: labels[action],
      message: `¿Deseas ${labels[action].toLowerCase()}?`,
      confirmLabel: labels[action],
      onConfirm: () => execute(action),
    });
  };
  const patientName =
    `${appointment.patient?.firstName || ""} ${appointment.patient?.lastName || ""}`.trim();
  const specialistName =
    `${appointment.specialist?.firstName || ""} ${appointment.specialist?.lastName || ""}`.trim();
  const isOnline = appointment.appointmentMode === "ONLINE";
  const dateTimeFormatted = formatAppointmentDateTime(
    appointment.appointmentStartDate,
    appointment.appointmentEndDate,
  );
  const locationDisplay = appointment.locationHall
    ? formatLocationLabel({
        name: appointment.locationHall.name || "Sede",
        hallName: appointment.locationHall.hallName || "",
      })
    : "No especificada";

  return (
    <>
      <Modal
        opened
        onClose={() => {
          if (!saving) onClose();
        }}
        closeOnClickOutside={!saving}
        closeOnEscape={!saving}
        withCloseButton={!saving}
        title="Detalles de la Cita"
        size="lg"
      >
        <Stack gap="md">
          <Badge color={status.color} variant="light">
            {status.label}
          </Badge>
          {lastChange && (
            <Alert color={status.color} variant="light">
              <Text size="sm">
                {status.label}:{" "}
                {new Date(lastChange.createdAt).toLocaleString()} ·{" "}
                {lastChange.actorName}
              </Text>
              {lastChange.reasonCode && (
                <Text size="sm">
                  Motivo: {CANCELLATION_REASONS[lastChange.reasonCode]}
                </Text>
              )}
              {lastChange.requestedBy && (
                <Text size="sm">
                  Solicitado por:{" "}
                  {CANCELLATION_REQUESTERS[lastChange.requestedBy]}
                </Text>
              )}
              {lastChange.note && (
                <Text size="sm" style={{ whiteSpace: "pre-wrap" }}>
                  {lastChange.note}
                </Text>
              )}
            </Alert>
          )}
          {/* Patient */}
          <div>
            <Text size="xs" fw={600} c="dimmed" tt="uppercase">
              Paciente
            </Text>
            <Text fw={500}>{patientName}</Text>
          </div>

          {/* Date and Time */}
          <div>
            <Text size="xs" fw={600} c="dimmed" tt="uppercase">
              Fecha y Hora
            </Text>
            <Text>{dateTimeFormatted}</Text>
          </div>

          {/* Mode */}
          <div>
            <Text size="xs" fw={600} c="dimmed" tt="uppercase">
              Tipo de Sesión
            </Text>
            <Text>{isOnline ? "Virtual" : "Presencial"}</Text>
          </div>

          {/* Location */}
          {!isOnline && (
            <div>
              <Text size="xs" fw={600} c="dimmed" tt="uppercase">
                Sede y sala
              </Text>
              <Text>{locationDisplay}</Text>
            </div>
          )}

          {/* Fee */}
          <div>
            <Text size="xs" fw={600} c="dimmed" tt="uppercase">
              Tarifa
            </Text>
            <Text>
              {appointment.feeAmount} {appointment.currencyCode}
            </Text>
          </div>

          {/* Specialist */}
          <div>
            <Text size="xs" fw={600} c="dimmed" tt="uppercase">
              Especialista
            </Text>
            <Text>{specialistName}</Text>
            {appointment.specialist?.shortName && (
              <Text size="sm" c="dimmed">
                {appointment.specialist.shortName}
              </Text>
            )}
          </div>

          {/* Notes */}
          {appointment.notes && (
            <div>
              <Text size="xs" fw={600} c="dimmed" tt="uppercase">
                Notas
              </Text>
              <Text style={{ whiteSpace: "pre-wrap" }}>
                {appointment.notes}
              </Text>
            </div>
          )}

          <Accordion variant="separated">
            <Accordion.Item value="history">
              <Accordion.Control>Historial de estados</Accordion.Control>
              <Accordion.Panel>
                {history.key !== historyKey ? (
                  <Loader size="sm" />
                ) : history.error ? (
                  <Alert color="red">
                    {history.error}
                    <Button
                      variant="subtle"
                      onClick={() => setRetry((value) => value + 1)}
                    >
                      Reintentar
                    </Button>
                  </Alert>
                ) : (
                  <Stack gap="sm">
                    {history.entries.length === 0 && (
                      <Text size="sm" c="dimmed">
                        Sin cambios de estado registrados.
                      </Text>
                    )}
                    {history.entries.map((entry) => (
                      <div key={entry.id}>
                        <Text size="sm" fw={600}>
                          {APPOINTMENT_STATUSES[entry.fromStatus].label} →{" "}
                          {APPOINTMENT_STATUSES[entry.toStatus].label}
                        </Text>
                        <Text size="xs" c="dimmed">
                          {new Date(entry.createdAt).toLocaleString()} ·{" "}
                          {entry.actorName}
                        </Text>
                        {entry.reasonCode && (
                          <Text size="sm">
                            Motivo: {CANCELLATION_REASONS[entry.reasonCode]}
                          </Text>
                        )}
                        {entry.requestedBy && (
                          <Text size="sm">
                            Solicitado por:{" "}
                            {CANCELLATION_REQUESTERS[entry.requestedBy]}
                          </Text>
                        )}
                        {entry.note && (
                          <Text size="sm" style={{ whiteSpace: "pre-wrap" }}>
                            {entry.note}
                          </Text>
                        )}
                      </div>
                    ))}
                  </Stack>
                )}
              </Accordion.Panel>
            </Accordion.Item>
          </Accordion>
          <Group gap="xs" wrap="wrap">
            {actions.includes("CONFIRM") && (
              <Button
                disabled={saving}
                onClick={() => requestAction("CONFIRM")}
              >
                Confirmar asistencia
              </Button>
            )}
            {actions.includes("COMPLETE") && (
              <Button
                disabled={saving}
                variant="light"
                onClick={() => requestAction("COMPLETE")}
              >
                {correction ? "Corregir a atendida" : "Marcar como atendida"}
              </Button>
            )}
            {actions.includes("NO_SHOW") && (
              <Button
                disabled={saving}
                color="orange"
                variant="light"
                onClick={() => requestAction("NO_SHOW")}
              >
                {correction ? "Corregir a no asistió" : "No se presentó"}
              </Button>
            )}
            {actions.includes("CANCEL") && (
              <Button
                disabled={saving}
                color="red"
                variant="light"
                onClick={() => requestAction("CANCEL")}
              >
                Cancelar cita
              </Button>
            )}
          </Group>
          <Group justify="flex-end">
            <Button variant="default" disabled={saving} onClick={onClose}>
              Cerrar
            </Button>
            {actions.includes("EDIT") && (
              <Button disabled={saving} onClick={onEdit}>
                Editar
              </Button>
            )}
          </Group>
        </Stack>
      </Modal>
      <Modal
        opened={formAction !== null}
        onClose={() => {
          if (!saving) setFormAction(null);
        }}
        title={
          formAction === "CANCEL" ? "Cancelar cita" : "Corregir cierre de cita"
        }
        closeOnClickOutside={!saving}
        closeOnEscape={!saving}
        withCloseButton={!saving}
      >
        <form
          onSubmit={(event) => {
            event.preventDefault();
            if (saving || !formAction) return;
            if (formAction === "CANCEL" && (!reasonCode || !requestedBy)) {
              setFormError(
                "Selecciona el motivo y quién solicitó la cancelación.",
              );
              return;
            }
            if (
              (formAction !== "CANCEL" || reasonCode === "OTHER") &&
              !note.trim()
            ) {
              setFormError("Escribe el motivo.");
              return;
            }
            void execute(formAction, {
              reasonCode: reasonCode ?? undefined,
              requestedBy: requestedBy ?? undefined,
              note: note.trim(),
            }).catch((err: unknown) =>
              toast.error(errorMessage(err, "No se pudo actualizar la cita.")),
            );
          }}
        >
          <Stack>
            {formAction === "CANCEL" ? (
              <>
                <Text size="sm">
                  La cita se ocultará del calendario y liberará el horario. Esta
                  acción no se puede deshacer.
                </Text>
                <Select
                  label="Motivo"
                  required
                  disabled={saving}
                  value={reasonCode}
                  data={Object.entries(CANCELLATION_REASONS).map(
                    ([value, label]) => ({ value, label }),
                  )}
                  onChange={(value) =>
                    setReasonCode(value as CancellationReason | null)
                  }
                />
                <Select
                  label="Solicitado por"
                  required
                  disabled={saving}
                  value={requestedBy}
                  data={Object.entries(CANCELLATION_REQUESTERS).map(
                    ([value, label]) => ({ value, label }),
                  )}
                  onChange={(value) =>
                    setRequestedBy(value as CancellationRequester | null)
                  }
                />
              </>
            ) : (
              <Text size="sm">
                Se corregirá el cierre a «
                {formAction === "COMPLETE" ? "Atendida" : "No asistió"}». El
                cambio quedará registrado en el historial.
              </Text>
            )}
            <Textarea
              label={
                formAction === "CANCEL" ? "Nota" : "Motivo de la corrección"
              }
              required={formAction !== "CANCEL" || reasonCode === "OTHER"}
              value={note}
              onChange={(event) => setNote(event.currentTarget.value)}
              maxLength={1000}
              disabled={saving}
            />
            {formError && <Alert color="red">{formError}</Alert>}
            <ModalActions
              onCancel={() => setFormAction(null)}
              loading={saving}
              cancelLabel="Volver"
              submitLabel={
                formAction === "CANCEL" ? "Cancelar cita" : "Guardar corrección"
              }
              destructive={formAction === "CANCEL"}
            />
          </Stack>
        </form>
      </Modal>
    </>
  );
}
