import {
  Modal,
  Stack,
  Select as MantineSelect,
  NumberInput,
  Textarea,
  Text,
  Switch,
  Group,
  Button,
  TextInput,
} from "@mantine/core";
import { useState } from "react";
import { patientService } from "../../services/patientService";
import { useRoles } from "../../hooks/useRoles";
import type { GetPatient } from "../../types/get-patient";
import type { AppointmentMode } from "../../data/http/appointmentsApi";
import { TagInput } from "./AppointmentsPage";
import type { Specialist } from "../../data/http/specialistsApi";
import type { Location } from "../../data/http/locationsApi";
import type { FormEvent } from "react";
import { useOnceEffect } from "../../hooks/useOnceEffect";

export function CreateAppointmentModal({
  open,
  specialists,
  locations,
  formData,
  onFormDataChange,
  onClose,
  onSubmit,
}: CreateAppointmentModalProps) {
  const specialistOptions = specialists.map((s) => ({
    value: s.id,
    label: `${s.firstName} ${s.lastName}`,
  }));

  const locationOptions = locations.map((l) => ({
    value: String(l.id),
    label: l.name,
  }));

  const isPresencial = formData.appointmentMode === "INPERSON";

  const { roleNames } = useRoles();
  const [patientQuery, setPatientQuery] = useState("");
  const [patientResults, setPatientResults] = useState<GetPatient[]>([]);

  // Debounce de la busqueda de pacientes
  useOnceEffect(() => {
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
    value: p.id,
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
    <Modal opened={open} onClose={onClose} title="Agendar Nueva Cita" size="lg">
      <form onSubmit={onSubmit}>
        <Stack gap="md">
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

          {/* Location (conditional) */}
          {isPresencial && (
            <MantineSelect
              label="Ubicación *"
              placeholder="Selecciona ubicación"
              data={locationOptions}
              value={formData.locationId}
              onChange={(value) =>
                onFormDataChange({ ...formData, locationId: value || "" })
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
                onFormDataChange({ ...formData, feeAmount: numValue || 120 });
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
                  currencyCode: (value as "PEN" | "USD" | "EUR") || "PEN",
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
          <Group justify="flex-end" gap="sm">
            <Button variant="default" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit">Agendar Cita</Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}

export interface CreateAppointmentModalProps {
  open: boolean;
  specialists: Specialist[];
  locations: Location[];
  formData: {
    feeAmount: number;
    currencyCode: "PEN" | "USD" | "EUR";
    appointmentMode: AppointmentMode;
    specialistId: string;
    locationId: string;
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
