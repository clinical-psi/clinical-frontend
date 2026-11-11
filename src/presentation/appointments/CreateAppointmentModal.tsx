import {
  Modal,
  Stack,
  Select as MantineSelect,
  NumberInput,
  Textarea,
  Text,
  Switch,
  Group,
  TextInput,
} from "@mantine/core";
import { ModalActions } from "../../components/feedback/ModalActions";
import { useEffect, useState } from "react";
import { patientService } from "../../services/patientService";
import { useRoles } from "../../hooks/useRoles";
import type { GetPatient } from "../../types/get-patient";
import type { AppointmentMode } from "../../data/http/appointmentsApi";
import { TagInput } from "./AppointmentsPage";
import type { Specialist } from "../../data/http/specialistsApi";
import { formatLocationLabel, type LocationHallOption } from "../../data/http/locationsApi";
import type { FormEvent } from "react";
import { AvailableSlotPicker } from "./AvailableSlotPicker";

export function CreateAppointmentModal({
  open,
  specialists,
  locations,
  formData,
  onFormDataChange,
  onClose,
  onSubmit,
  editing = false,
  saving = false,
}: CreateAppointmentModalProps) {
  const specialistOptions = specialists.map((s) => ({
    value: String(s.id),
    label: `${s.firstName} ${s.lastName}`,
  }));

  const locationOptions = locations.map((l) => ({
    value: String(l.id),
    label: formatLocationLabel(l),
  }));

  const isPresencial = formData.appointmentMode === "INPERSON";

  const { roleNames, can } = useRoles();
  const [patientQuery, setPatientQuery] = useState("");
  const [patientResults, setPatientResults] = useState<GetPatient[]>([]);

  // Debounce de la busqueda de pacientes
  useEffect(() => {
    const q = patientQuery.trim();
    if (!open || q.length < 2) {
      setPatientResults([]);
      return;
    }
    const timer = setTimeout(() => {
      patientService
        .getAll(roleNames, q)
        .then((result) => setPatientResults(result.content))
        .catch(() => setPatientResults([]));
    }, 300);
    return () => clearTimeout(timer);
  }, [roleNames, patientQuery, open]);

  const patientOptions = patientResults.map((p) => ({
    value: String(p.id),
    label: `${p.firstName} ${p.lastName}`,
  }));
  // Mantine necesita la opcion seleccionada en `data` para mostrar su etiqueta
  if (
    formData.patientId &&
    !patientOptions.some((o) => o.value === formData.patientId)
  ) {
    patientOptions.push({
      value: formData.patientId,
      label: formData.patientLabel,
    });
  }

  return (
    <Modal
      opened={open}
      onClose={onClose}
      title={editing ? "Editar Cita" : "Agendar Nueva Cita"}
      size="lg"
      closeOnClickOutside={!saving}
      closeOnEscape={!saving}
      withCloseButton={!saving}
    >
      <form onSubmit={onSubmit}>
        <fieldset disabled={saving} style={{ border: 0, padding: 0, margin: 0, minWidth: 0 }}>
        <Stack gap="md">
          {editing && <Text size="sm" c="dimmed">Si cambias el horario o el especialista de una cita confirmada, volverá a Agendada y requerirá una nueva confirmación.</Text>}
          {/* Patient */}
          <MantineSelect
            label="Paciente"
            placeholder="Busca por nombre o apellido"
            data={patientOptions}
            value={formData.patientId || null}
            onChange={(value, option) => {
              onFormDataChange({
                ...formData,
                patientId: value || "",
                patientLabel: option?.label ?? "",
              });
            }}
            searchValue={patientQuery}
            onSearchChange={setPatientQuery}
            filter={({ options }) => options}
            nothingFoundMessage={
              patientQuery.trim().length < 2
                ? "Escribe al menos 2 caracteres"
                : "Sin resultados"
            }
            required
            searchable
            disabled={editing}
          />

          {/* Specialist */}
          <MantineSelect
            label="Especialista"
            placeholder="Selecciona especialista"
            data={specialistOptions}
            value={formData.specialistId}
            onChange={(value) =>
              onFormDataChange({ ...formData, specialistId: value || "" })
            }
            required
            searchable
          />

          {/* Session Type */}
          <MantineSelect
            label="Tipo de Sesión"
            placeholder="Selecciona tipo"
            data={[
              { value: "ONLINE", label: "Virtual" },
              { value: "INPERSON", label: "Presencial" },
            ]}
            value={formData.appointmentMode}
            onChange={(value) =>
              onFormDataChange({
                ...formData,
                appointmentMode: value as AppointmentMode,
              })
            }
            required
          />

          <Group grow>
            <TextInput
              type="datetime-local"
              label="Fecha y hora inicio"
              value={formData.appointmentStartDate}
              onChange={(e) =>
                onFormDataChange({
                  ...formData,
                  appointmentStartDate: e.currentTarget.value,
                })
              }
              required
            />
            <TextInput
              type="datetime-local"
              label="Fecha y hora fin"
              value={formData.appointmentEndDate}
              min={formData.appointmentStartDate}
              onChange={(e) =>
                onFormDataChange({
                  ...formData,
                  appointmentEndDate: e.currentTarget.value,
                })
              }
              required
            />
          </Group>

          {can("availability.view") && formData.specialistId && (
            <AvailableSlotPicker
              specialistId={formData.specialistId}
              date={formData.appointmentStartDate}
              appointmentMode={formData.appointmentMode}
              locationHallId={formData.locationHallId}
              selectedStart={formData.appointmentStartDate}
              onPick={(start, end) =>
                onFormDataChange({
                  ...formData,
                  appointmentStartDate: start,
                  appointmentEndDate: end,
                })
              }
            />
          )}

          {/* Location (conditional) */}
          {isPresencial && (
            <MantineSelect
              label="Sede y sala"
              placeholder="Selecciona sede y sala"
              data={locationOptions}
              value={formData.locationHallId}
              onChange={(value) =>
                onFormDataChange({ ...formData, locationHallId: value || "" })
              }
              required
              searchable
            />
          )}

          <Group>
            {/* Fee Amount */}
            <NumberInput
              label="Tarifa (Monto)"
              placeholder="120"
              value={formData.feeAmount}
              onChange={(value) => {
                const numValue =
                  typeof value === "string" ? parseFloat(value) : value;
                onFormDataChange({ ...formData, feeAmount: Number.isFinite(numValue) ? numValue : 0 });
              }}
              min={0}
              step={0.01}
              required
            />

            {/* Currency */}
            <MantineSelect
              label="Moneda"
              placeholder="Selecciona moneda"
              data={[
                { value: "PEN", label: "PEN" },
                { value: "USD", label: "USD" },
                { value: "EUR", label: "EUR" },
              ]}
              value={formData.currencyCode}
              onChange={(value) =>
                onFormDataChange({
                  ...formData,
                  currencyCode: value || "PEN",
                })
              }
              required
            />
            <Switch
              label="Pago realizado"
              checked={formData.paidIndicator}
              onChange={(e) =>
                onFormDataChange({
                  ...formData,
                  paidIndicator: e.currentTarget.checked,
                })
              }
            />
          </Group>

          {/* Notes */}
          <Textarea
            label="Notas Adicionales"
            placeholder="Información relevante para la cita"
            rows={4}
            value={formData.notes}
            onChange={(e) =>
              onFormDataChange({ ...formData, notes: e.currentTarget.value })
            }
          />

          {/* Tags */}
          <div>
            <Text size="sm" fw={500} mb="xs">
              Etiquetas
            </Text>
            <TagInput
              tags={formData.tags}
              onChange={(tags) => onFormDataChange({ ...formData, tags })}
            />
            <Text size="xs" c="dimmed" mt="xs">
              Pulsa coma o Enter para crear una etiqueta.
            </Text>
          </div>

          {/* Actions */}
          <ModalActions
            onCancel={onClose}
            submitLabel={editing ? "Guardar cambios" : "Agendar Cita"}
            loading={saving}
          />
        </Stack>
        </fieldset>
      </form>
    </Modal>
  );
}

export interface CreateAppointmentModalProps {
  open: boolean;
  editing?: boolean;
  saving?: boolean;
  specialists: Specialist[];
  locations: LocationHallOption[];
  formData: {
    feeAmount: number;
    currencyCode: string;
    appointmentMode: AppointmentMode;
    specialistId: string;
    locationHallId: string;
    patientId: string;
    patientLabel: string;
    appointmentStartDate: string;
    appointmentEndDate: string;
    notes: string;
    tags: string[];
    paidIndicator: boolean;
  };
  onFormDataChange: (data: CreateAppointmentModalProps["formData"]) => void;
  onClose: () => void;
  onSubmit: (e: FormEvent<HTMLFormElement>) => void;
}
