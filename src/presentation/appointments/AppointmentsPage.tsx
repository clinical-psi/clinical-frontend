import { useState, type FormEvent, type KeyboardEvent } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import timeGridPlugin from "@fullcalendar/timegrid";
import type { DatesSetArg, EventClickArg } from "@fullcalendar/core";
import {
  Container,
  Stack,
  Paper,
  Group,
  Title,
  Text,
  Button,
  Loader,
  LoadingOverlay,
  Alert,
  MultiSelect,
} from "@mantine/core";
import { IconX } from "@tabler/icons-react";
import Snackbar from "@mui/material/Snackbar";
import MUIAlert from "@mui/material/Alert";
import { specialistService } from "../../services/specialistService";
import { locationService } from "../../services/locationService";
import {
  type AppointmentMode,
  type Appointment,
  type FilterAppointmentsRequest,
} from "../../data/http/appointmentsApi";
import type { Specialist } from "../../data/http/specialistsApi";
import type { Location } from "../../data/http/locationsApi";
import {
  normalizeCalendarDateTime,
  calculateDateRange,
  formatToDateTime,
} from "../../util/utils";
import { appointmentService } from "../../services/appointmentService";
import { AppointmentViewModal } from "../../presentation/appointments/AppointmentViewModal";
import { CreateAppointmentModal } from "../../presentation/appointments/CreateAppointmentModal";
import { getNextAvailableHourOfDay } from "../../util/utils";
import { useOnceEffect } from "../../hooks/useOnceEffect";

export function AppointmentsPage() {
  return (
    <Container size="xl" py="xl">
      <Stack gap="lg">
        {/* Header */}
        <div>
          <Title order={1}>Citas</Title>
          <Text c="dimmed" size="sm">
            Organiza y consulta las sesiones del centro psicológico.
          </Text>
        </div>

        <AppointmentsCalendar />
      </Stack>
    </Container>
  );
}

type TagInputProps = {
  tags: string[];
  onChange: (tags: string[]) => void;
};

export function TagInput({ tags, onChange }: TagInputProps) {
  const [draft, setDraft] = useState("");

  function addTag(value: string) {
    const tag = value.trim();
    if (
      !tag ||
      tags.some((currentTag) => currentTag.toLowerCase() === tag.toLowerCase())
    )
      return;
    onChange([...tags, tag]);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "," || event.key === "Enter") {
      event.preventDefault();
      addTag(draft);
      setDraft("");
      return;
    }

    if (event.key === "Backspace" && !draft && tags.length > 0) {
      onChange(tags.slice(0, -1));
    }
  }

  function handleChange(value: string) {
    if (value.includes(",")) {
      const parts = value.split(",");
      parts.slice(0, -1).forEach(addTag);
      setDraft(parts.at(-1) ?? "");
      return;
    }

    setDraft(value);
  }

  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: "0.5rem",
        alignItems: "center",
      }}
    >
      {tags.map((tag) => (
        <div
          key={tag}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            padding: "0.25rem 0.75rem",
            backgroundColor: "#e9ecef",
            borderRadius: "1rem",
            fontSize: "0.875rem",
          }}
        >
          {tag}
          <button
            type="button"
            aria-label={`Eliminar etiqueta ${tag}`}
            onClick={() =>
              onChange(tags.filter((currentTag) => currentTag !== tag))
            }
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: "0",
              display: "flex",
              alignItems: "center",
            }}
          >
            <IconX size={14} />
          </button>
        </div>
      ))}
      <input
        value={draft}
        onChange={(event) => handleChange(event.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={() => {
          if (draft) addTag(draft);
          setDraft("");
        }}
        placeholder={tags.length === 0 ? "Agrega etiquetas (Enter/,)" : ""}
        style={{
          flex: 1,
          minWidth: "120px",
          border: "none",
          outline: "none",
          fontSize: "0.875rem",
        }}
      />
    </div>
  );
}

const EMPTY_CREATE_FORM = {
  feeAmount: 120,
  currencyCode: "PEN" as "PEN" | "USD" | "EUR",
  appointmentMode: "ONLINE" as AppointmentMode,
  specialistId: "",
  locationId: "",
  patientId: "",
  patientLabel: "",
  appointmentStartDate: "",
  appointmentEndDate: "",
  notes: "",
  tags: [] as string[],
  paidIndicator: false,
};

function AppointmentsCalendar() {
  const [specialists, setSpecialists] = useState<Specialist[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [selectedSpecialistIds, setSelectedSpecialistIds] = useState<string[]>(
    [],
  );
  const [selectedModes, setSelectedModes] = useState<AppointmentMode[]>([]);
  const [calendarDateRange, setCalendarDateRange] = useState<{
    start: string;
    end: string;
  } | null>(null);
  const [events, setEvents] = useState<
    Array<{
      id: string;
      title: string;
      start: string;
      end: string;
      extendedProps?: Record<string, unknown>;
    }>
  >([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedAppointment, setSelectedAppointment] =
    useState<Appointment | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createFormData, setCreateFormData] = useState(EMPTY_CREATE_FORM);
  const [refreshKey, setRefreshKey] = useState(0);
  const [toastMessage, setToastMessage] = useState("");
  const [toastSeverity, setToastSeverity] = useState<"success" | "error">(
    "success",
  );
  const [showToast, setShowToast] = useState(false);

  // Load specialists and locations on mount
  useOnceEffect(() => {
    Promise.all([
      specialistService.getAll().catch((err: Error) => {
        setError(err.message);
        return [];
      }),
      locationService.getAll().catch((err: Error) => {
        setError(err.message);
        return [];
      }),
    ]).then(([specs, locs]) => {
      setSpecialists(specs);
      setLocations(locs);
    });
  }, []);

  function transformAppointments(appointments: Appointment[]) {
    const calendarEvents = appointments.map((apt) => ({
      id: apt.id,
      title:
        `${apt.patient?.firstName ?? ""} ${apt.patient?.lastName ?? ""}`.trim() ||
        "Cita ocupada",
      start: apt.appointmentStartDate,
      end: apt.appointmentEndDate,
      extendedProps: {
        fullAppointment: apt,
      },
    }));
    setEvents(calendarEvents);
  }

  // Load appointments when date range or filters change
  useOnceEffect(() => {
    if (!calendarDateRange) {
      setEvents([]);
      return;
    }

    setLoading(true);
    let cancelled = false;
    const request: FilterAppointmentsRequest = {
      startDate: normalizeCalendarDateTime(calendarDateRange.start),
      endDate: normalizeCalendarDateTime(calendarDateRange.end),
      specialistIds: selectedSpecialistIds,
      appointmentModes: selectedModes,
    };

    appointmentService
      .getByFilters(request)
      .then((appointments) => {
        if (!cancelled) transformAppointments(appointments);
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    // Una respuesta antigua no debe pisar los eventos del rango actual
    return () => {
      cancelled = true;
    };
  }, [selectedSpecialistIds, selectedModes, calendarDateRange, refreshKey]);

  function handleDatesSet(datesInfo: DatesSetArg) {
    setCalendarDateRange((prev) => {
      const newRange = calculateDateRange(datesInfo, prev);
      return newRange ?? prev;
    });
  }

  function handleEventClick(clickInfo: EventClickArg) {
    console.log("test");
    const appointment = clickInfo.event.extendedProps?.["fullAppointment"] as
      | Appointment
      | undefined;
    if (appointment) {
      setSelectedAppointment(appointment);
      setIsViewModalOpen(true);
    }
  }

  function handleOpenCreateModal() {
    const nextAvailableHourStart = getNextAvailableHourOfDay(new Date());
    const nextAvailableHourEnd = new Date(nextAvailableHourStart);
    nextAvailableHourEnd.setHours(nextAvailableHourEnd.getHours() + 1);
    setCreateFormData((prev) => ({
      ...prev,
      specialistId: !selectedSpecialistIds.length
        ? selectedSpecialistIds[0]
        : "",
      appointmentStartDate: formatToDateTime(nextAvailableHourStart),
      appointmentEndDate: formatToDateTime(nextAvailableHourEnd),
      paidIndicator: false,
    }));
    setIsCreateModalOpen(true);
  }

  function handleSaveAppointment(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = createFormData;

    if (!f.patientId) {
      setToastMessage("Selecciona un paciente");
      setToastSeverity("error");
      setShowToast(true);
      return;
    }
    if (new Date(f.appointmentEndDate) <= new Date(f.appointmentStartDate)) {
      setToastMessage("La fecha de fin debe ser posterior al inicio");
      setToastSeverity("error");
      setShowToast(true);
      return;
    }

    appointmentService
      .create(f.patientId, {
        specialistId: f.specialistId,
        locationId:
          f.appointmentMode === "INPERSON"
            ? f.locationId || undefined
            : undefined,
        appointmentMode: f.appointmentMode,
        appointmentStartDate: normalizeCalendarDateTime(f.appointmentStartDate),
        appointmentEndDate: normalizeCalendarDateTime(f.appointmentEndDate),
        feeAmount: String(f.feeAmount),
        currencyCode: f.currencyCode,
        notes: f.notes || undefined,
        paidIndicator: f.paidIndicator,
      })
      .then(() => {
        setToastMessage("Cita creada exitosamente");
        setToastSeverity("success");
        setShowToast(true);
        setIsCreateModalOpen(false);
        setCreateFormData(EMPTY_CREATE_FORM);
        setRefreshKey((k) => k + 1);
      })
      .catch((err: Error) => {
        setToastMessage(err.message);
        setToastSeverity("error");
        setShowToast(true);
      });
  }

  const specialistOptions = specialists.map((s) => ({
    value: s.id,
    label: `${s.firstName} ${s.lastName}`,
  }));

  return (
    <Stack gap="lg">
      {error && (
        <Alert title="Error" color="red" onClose={() => setError("")}>
          {error}
        </Alert>
      )}

      {/* Filters */}
      <Paper p="md" radius="md" bg="var(--surface)">
        <Group grow mb="md">
          <MultiSelect
            label="Especialistas"
            placeholder="Selecciona especialistas"
            data={specialistOptions}
            value={selectedSpecialistIds}
            onChange={setSelectedSpecialistIds}
            searchable
            clearable
          />

          <MultiSelect
            label="Tipo de Sesión"
            placeholder="Selecciona tipo de sesión"
            data={[
              { value: "ONLINE", label: "Virtual" },
              { value: "INPERSON", label: "Presencial" },
            ]}
            value={selectedModes}
            onChange={(value) => setSelectedModes(value as AppointmentMode[])}
            clearable
          />
        </Group>

        <Button onClick={handleOpenCreateModal} fullWidth>
          Agendar Cita
        </Button>
      </Paper>

      {/* Calendar */}
      {/* No desmontar el calendario: perderia la vista activa y re-dispararia datesSet */}
      {
        <Paper p="md" radius="md" pos="relative" style={{ overflow: "auto" }}>
          <LoadingOverlay
            visible={loading}
            loaderProps={{ children: <Loader /> }}
          />
          <div style={{ minHeight: "600px" }}>
            <FullCalendar
              plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
              initialView="timeGridWeek"
              headerToolbar={{
                left: "prev,next today",
                center: "title",
                right: "dayGridMonth,timeGridWeek,timeGridDay",
              }}
              buttonText={{
                today: "Hoy",
                month: "Mes",
                week: "Semana",
                day: "Día",
              }}
              locale="es"
              firstDay={1}
              allDaySlot={false}
              slotMinTime="08:00:00"
              slotMaxTime="24:00:00"
              height="auto"
              events={events}
              selectMirror={true}
              selectable={true}
              datesSet={handleDatesSet}
              eventClick={handleEventClick}
            />
          </div>
        </Paper>
      }

      {/* View Appointment Modal */}
      {selectedAppointment && isViewModalOpen && (
        <AppointmentViewModal
          appointment={selectedAppointment}
          onClose={() => {
            setIsViewModalOpen(false);
            setSelectedAppointment(null);
          }}
        />
      )}

      {/* Create Appointment Modal */}
      <CreateAppointmentModal
        open={isCreateModalOpen}
        specialists={specialists}
        locations={locations}
        formData={createFormData}
        onFormDataChange={setCreateFormData}
        onClose={() => {
          setIsCreateModalOpen(false);
          setCreateFormData(EMPTY_CREATE_FORM);
        }}
        onSubmit={handleSaveAppointment}
      />

      {/* Toast Notifications */}
      <Snackbar
        open={showToast}
        autoHideDuration={4000}
        onClose={() => setShowToast(false)}
      >
        <MUIAlert severity={toastSeverity} onClose={() => setShowToast(false)}>
          {toastMessage}
        </MUIAlert>
      </Snackbar>
    </Stack>
  );
}

export interface AppointmentViewModalProps {
  appointment: Appointment;
  onClose: () => void;
}
