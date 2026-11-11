import {
  useEffect,
  useMemo,
  useState,
  type FormEvent,
  type KeyboardEvent,
} from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import timeGridPlugin from "@fullcalendar/timegrid";
import type {
  DateSelectArg,
  DatesSetArg,
  EventClickArg,
  EventInput,
} from "@fullcalendar/core";
import {
  Container,
  Stack,
  Paper,
  Group,
  Title,
  Text,
  Button,
  Badge,
  Modal,
  Loader,
  LoadingOverlay,
  Alert,
  MultiSelect,
  Switch,
  getContrastColor,
  useMantineTheme,
} from "@mantine/core";
import { IconHelpCircle, IconX } from "@tabler/icons-react";
import { useToast } from "../../components/feedback/feedbackContext";
import { specialistService } from "../../services/specialistService";
import { locationService } from "../../services/locationService";
import {
  type AppointmentMode,
  type Appointment,
  type CreateAppointmentRequest,
  type FilterAppointmentsRequest,
  type AppointmentStatus,
} from "../../data/http/appointmentsApi";
import type { Specialist } from "../../data/http/specialistsApi";
import type { LocationHallOption } from "../../data/http/locationsApi";
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
import { useRoles } from "../../hooks/useRoles";
import { availabilityService } from "../../services/availabilityService";
import { AvailabilityLegend } from "../availability/AvailabilityLegend";
import type { AvailabilityCalendarEvent } from "../../types/availability";
import { APPOINTMENT_STATUSES } from "./appointmentStatus";

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
  currencyCode: "PEN",
  appointmentMode: "ONLINE" as AppointmentMode,
  specialistId: "",
  locationHallId: "",
  patientId: "",
  patientLabel: "",
  appointmentStartDate: "",
  appointmentEndDate: "",
  notes: "",
  tags: [] as string[],
  paidIndicator: false,
};

function AppointmentsCalendar() {
  const theme = useMantineTheme();
  const [specialists, setSpecialists] = useState<Specialist[]>([]);
  const [locations, setLocations] = useState<LocationHallOption[]>([]);
  const [selectedSpecialistIds, setSelectedSpecialistIds] = useState<string[]>(
    [],
  );
  const [selectedModes, setSelectedModes] = useState<AppointmentMode[]>([]);
  const [selectedStatuses, setSelectedStatuses] = useState<AppointmentStatus[]>(
    [],
  );
  const [calendarDateRange, setCalendarDateRange] = useState<{
    start: string;
    end: string;
  } | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(false);
  const [availabilityEvents, setAvailabilityEvents] = useState<
    AvailabilityCalendarEvent[]
  >([]);
  const [showAvailability, setShowAvailability] = useState(true);
  const [showCalendarHelp, setShowCalendarHelp] = useState(false);
  const canViewAvailability = useRoles().can("availability.view");
  const [error, setError] = useState("");
  const [selectedAppointment, setSelectedAppointment] =
    useState<Appointment | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingAppointmentId, setEditingAppointmentId] = useState<
    string | null
  >(null);
  const [editingLocation, setEditingLocation] =
    useState<LocationHallOption | null>(null);
  const [savingAppointment, setSavingAppointment] = useState(false);
  const [createFormData, setCreateFormData] = useState(EMPTY_CREATE_FORM);
  const [refreshKey, setRefreshKey] = useState(0);
  const [now, setNow] = useState(() => Date.now());
  const toast = useToast();
  const { isAdmin } = useRoles();

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNow(Date.now());
      setRefreshKey((value) => value + 1);
    }, 60_000);
    return () => window.clearInterval(timer);
  }, []);

  // Load specialists and locations on mount
  useOnceEffect(() => {
    Promise.all([
      (isAdmin
        ? specialistService.getAll()
        : availabilityService
            .getMySpecialistProfile()
            .then((profile) => [profile])
      ).catch((err: Error) => {
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
  });

  const events = useMemo<EventInput[]>(
    () =>
      appointments.map((apt) => {
        const color =
          specialists.find((s) => String(s.id) === String(apt.specialist?.id))
            ?.agendaColor ??
          apt.specialist?.agendaColor ??
          "#4C6EF5";
        return {
          id: apt.id,
          title:
            `${apt.patient?.firstName ?? ""} ${apt.patient?.lastName ?? ""}`.trim() ||
            "Cita ocupada",
          start: apt.appointmentStartDate,
          end: apt.appointmentEndDate,
          backgroundColor: color,
          borderColor: color,
          textColor: getContrastColor({ color, theme, autoContrast: true }),
          display: "block",
          classNames: [
            "fc-saved-appointment",
            `appointment-status-${apt.status.toLowerCase()}`,
          ],
          extendedProps: {
            fullAppointment: apt,
          },
        };
      }),
    [appointments, specialists, theme],
  );

  // Load appointments when date range or filters change
  useEffect(() => {
    if (!calendarDateRange) {
      setAppointments([]);
      return;
    }

    setLoading(true);
    let cancelled = false;
    const request: FilterAppointmentsRequest = {
      startDate: normalizeCalendarDateTime(calendarDateRange.start),
      endDate: normalizeCalendarDateTime(calendarDateRange.end),
      specialistIds: selectedSpecialistIds,
      appointmentModes: selectedModes,
      statuses: selectedStatuses,
    };

    appointmentService
      .getByFilters(request)
      .then((appointments) => {
        if (!cancelled) {
          setAppointments(appointments);
          setSelectedAppointment((current) =>
            current
              ? (appointments.find(
                  (appointment) =>
                    String(appointment.id) === String(current.id),
                ) ?? current)
              : null,
          );
        }
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
  }, [
    selectedSpecialistIds,
    selectedModes,
    selectedStatuses,
    calendarDateRange,
    refreshKey,
  ]);

  // La API comparte estos eventos con otros calendarios; la presentacion se adapta aqui.
  useEffect(() => {
    if (!calendarDateRange || !canViewAvailability || !showAvailability) {
      return;
    }
    let cancelled = false;
    availabilityService
      .getCalendarEvents({
        start: normalizeCalendarDateTime(calendarDateRange.start),
        end: normalizeCalendarDateTime(calendarDateRange.end),
        specialistIds: selectedSpecialistIds,
        appointmentMode:
          selectedModes.length === 1 ? selectedModes[0] : undefined,
      })
      .then((data) => {
        if (cancelled) return;
        setAvailabilityEvents(data);
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err.message);
      });
    return () => {
      cancelled = true;
    };
  }, [
    calendarDateRange,
    selectedSpecialistIds,
    selectedModes,
    canViewAvailability,
    showAvailability,
    refreshKey,
  ]);

  const visibleSpecialists = useMemo(
    () =>
      specialists.filter(
        (specialist) =>
          selectedSpecialistIds.length === 0 ||
          selectedSpecialistIds.includes(String(specialist.id)),
      ),
    [specialists, selectedSpecialistIds],
  );

  const specialistAvailabilityEvents = useMemo<EventInput[]>(
    () =>
      availabilityEvents.map((event) => {
        const specialist = specialists.find(
          (item) =>
            String(item.id) === String(event.extendedProps.specialistId),
        );
        const color = specialist?.agendaColor ?? "#4C6EF5";
        const name = specialist
          ? specialist.shortName ||
            `${specialist.firstName} ${specialist.lastName}`.trim()
          : `Especialista ${event.extendedProps.specialistId}`;
        const blocked = event.extendedProps.type === "BLOCKED";
        return {
          ...event,
          id: `availability-${event.id}`,
          title: `${name} · ${blocked ? "Bloqueado" : "Disponible"}`,
          display: "block",
          editable: false,
          backgroundColor: `color-mix(in srgb, ${color} 8%, transparent)`,
          borderColor: color,
          textColor: "var(--ink)",
          classNames: [
            "fc-specialist-availability",
            ...(blocked ? ["fc-specialist-availability-blocked"] : []),
          ],
          extendedProps: {
            ...event.extendedProps,
            specialistAvailability: true,
          },
        };
      }),
    [availabilityEvents, specialists],
  );

  const combinedEvents = useMemo(
    () =>
      canViewAvailability && showAvailability
        ? [...specialistAvailabilityEvents, ...events]
        : events,
    [
      specialistAvailabilityEvents,
      events,
      canViewAvailability,
      showAvailability,
    ],
  );

  function handleSelectRange(selection: DateSelectArg) {
    setEditingAppointmentId(null);
    setEditingLocation(null);
    selection.view.calendar.unselect();
    const end = selection.allDay
      ? new Date(selection.start.getTime() + 60 * 60 * 1000)
      : selection.end;
    setCreateFormData(() => ({
      ...EMPTY_CREATE_FORM,
      specialistId:
        selectedSpecialistIds.length === 1 ? selectedSpecialistIds[0] : "",
      appointmentStartDate: formatToDateTime(selection.start),
      appointmentEndDate: formatToDateTime(end),
      paidIndicator: false,
    }));
    setIsCreateModalOpen(true);
  }

  function handleDatesSet(datesInfo: DatesSetArg) {
    setCalendarDateRange((prev) => {
      const newRange = calculateDateRange(datesInfo, prev);
      return newRange ?? prev;
    });
  }

  function handleEventClick(clickInfo: EventClickArg) {
    const appointment = clickInfo.event.extendedProps?.["fullAppointment"] as
      | Appointment
      | undefined;
    if (appointment) {
      setSelectedAppointment(appointment);
      setIsViewModalOpen(true);
    }
  }

  function handleOpenCreateModal() {
    setEditingAppointmentId(null);
    setEditingLocation(null);
    const nextAvailableHourStart = getNextAvailableHourOfDay(new Date());
    const nextAvailableHourEnd = new Date(nextAvailableHourStart);
    nextAvailableHourEnd.setHours(nextAvailableHourEnd.getHours() + 1);
    setCreateFormData(() => ({
      ...EMPTY_CREATE_FORM,
      specialistId:
        selectedSpecialistIds.length === 1 ? selectedSpecialistIds[0] : "",
      appointmentStartDate: formatToDateTime(nextAvailableHourStart),
      appointmentEndDate: formatToDateTime(nextAvailableHourEnd),
      paidIndicator: false,
    }));
    setIsCreateModalOpen(true);
  }

  function handleEditAppointment(appointment: Appointment) {
    setEditingAppointmentId(appointment.id);
    setEditingLocation(
      appointment.locationHall
        ? {
            id: Number(appointment.locationHall.id),
            locationId: appointment.locationHall.locationId,
            name: appointment.locationHall.name ?? "Sede",
            hallName: appointment.locationHall.hallName ?? "",
          }
        : null,
    );
    setCreateFormData({
      ...EMPTY_CREATE_FORM,
      patientId: String(appointment.patient?.id ?? ""),
      patientLabel:
        `${appointment.patient?.firstName ?? ""} ${appointment.patient?.lastName ?? ""}`.trim(),
      specialistId: String(appointment.specialist?.id ?? ""),
      locationHallId: String(appointment.locationHall?.id ?? ""),
      appointmentMode: appointment.appointmentMode,
      appointmentStartDate: formatToDateTime(
        new Date(appointment.appointmentStartDate),
      ),
      appointmentEndDate: formatToDateTime(
        new Date(appointment.appointmentEndDate),
      ),
      feeAmount: Number(appointment.feeAmount ?? 0),
      currencyCode: appointment.currencyCode ?? "PEN",
      notes: appointment.notes ?? "",
      paidIndicator: appointment.paidIndicator ?? false,
    });
    setIsViewModalOpen(false);
    setSelectedAppointment(null);
    setIsCreateModalOpen(true);
  }

  function handleSaveAppointment(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (savingAppointment) return;
    const f = createFormData;

    if (!f.patientId) {
      toast.error("Selecciona un paciente");
      return;
    }
    if (new Date(f.appointmentEndDate) <= new Date(f.appointmentStartDate)) {
      toast.error("La fecha de fin debe ser posterior al inicio");
      return;
    }

    const request: CreateAppointmentRequest = {
      specialistId: f.specialistId,
      locationHallId:
        f.appointmentMode === "INPERSON"
          ? f.locationHallId || undefined
          : undefined,
      appointmentMode: f.appointmentMode,
      appointmentStartDate: normalizeCalendarDateTime(f.appointmentStartDate),
      appointmentEndDate: normalizeCalendarDateTime(f.appointmentEndDate),
      feeAmount: String(f.feeAmount),
      currencyCode: f.currencyCode,
      notes: f.notes || undefined,
      paidIndicator: f.paidIndicator,
    };
    setSavingAppointment(true);
    const save = editingAppointmentId
      ? appointmentService.update(editingAppointmentId, request)
      : appointmentService.create(f.patientId, request);
    save
      .then(() => {
        toast.success(
          editingAppointmentId
            ? "Cita actualizada satisfactoriamente"
            : "Cita creada satisfactoriamente",
        );
        setIsCreateModalOpen(false);
        setCreateFormData(EMPTY_CREATE_FORM);
        setEditingAppointmentId(null);
        setEditingLocation(null);
        setRefreshKey((k) => k + 1);
      })
      .catch((err: Error) => {
        toast.error(err.message);
      })
      .finally(() => setSavingAppointment(false));
  }

  const specialistOptions = specialists.map((s) => ({
    value: String(s.id),
    label: `${s.firstName} ${s.lastName}`,
  }));
  const pendingClosure = appointments.filter(
    (appointment) =>
      (appointment.status === "SCHEDULED" ||
        appointment.status === "CONFIRMED") &&
      new Date(appointment.appointmentEndDate).getTime() <= now &&
      appointment.allowedActions.some(
        (action) => action === "COMPLETE" || action === "NO_SHOW",
      ),
  );

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
            className="text-field"
            placeholder="Selecciona especialistas"
            data={specialistOptions}
            value={selectedSpecialistIds}
            onChange={setSelectedSpecialistIds}
            searchable
            clearable
          />

          <MultiSelect
            label="Tipo de Sesión"
            className="text-field"
            placeholder="Selecciona tipo de sesión"
            data={[
              { value: "ONLINE", label: "Virtual" },
              { value: "INPERSON", label: "Presencial" },
            ]}
            value={selectedModes}
            onChange={(value) => setSelectedModes(value as AppointmentMode[])}
            clearable
          />
          <MultiSelect
            label="Estados"
            className="text-field"
            placeholder="Selecciona estados"
            data={Object.entries(APPOINTMENT_STATUSES).map(([value, item]) => ({
              value,
              label: item.label,
            }))}
            value={selectedStatuses}
            onChange={(values) =>
              setSelectedStatuses(values as AppointmentStatus[])
            }
          />
        </Group>
        <Group justify="space-between" gap="sm" mb="md" wrap="wrap">
          {canViewAvailability && (
            <Switch
              label="Mostrar disponibilidad y bloqueos"
              checked={showAvailability}
              onChange={(event) =>
                setShowAvailability(event.currentTarget.checked)
              }
            />
          )}
          <Button
            variant="subtle"
            size="xs"
            leftSection={<IconHelpCircle size={16} />}
            onClick={() => setShowCalendarHelp(true)}
          >
            Ayuda del calendario
          </Button>
        </Group>

        <Button onClick={handleOpenCreateModal} fullWidth>
          Agendar Cita
        </Button>
      </Paper>
      <Modal
        opened={showCalendarHelp}
        onClose={() => setShowCalendarHelp(false)}
        title="Ayuda del calendario"
        size="lg"
      >
        <Stack gap="lg">
          <Stack gap="xs">
            <Text fw={600}>Estados de las citas</Text>
            <Group gap="xs">
              {Object.entries(APPOINTMENT_STATUSES).map(([value, item]) => (
                <Badge key={value} variant="light" color={item.color}>
                  {item.marker} {item.label}
                </Badge>
              ))}
            </Group>
            <Text size="sm" c="dimmed">
              Las citas canceladas se consideran eliminadas. Selecciona
              «Cancelada» en Estados para consultarlas.
            </Text>
          </Stack>
          {canViewAvailability && (
            <Stack gap="xs">
              <Text fw={600}>Disponibilidad y colores de agendas</Text>
              <Text size="sm" c="dimmed">
                Cada color identifica la agenda de un especialista según los
                filtros seleccionados.
              </Text>
              <AvailabilityLegend specialists={visibleSpecialists} />
            </Stack>
          )}
          <Group justify="flex-end">
            <Button
              variant="default"
              onClick={() => setShowCalendarHelp(false)}
            >
              Cerrar
            </Button>
          </Group>
        </Stack>
      </Modal>
      {pendingClosure.length > 0 && (
        <Paper p="md" radius="md" withBorder>
          <Stack gap="sm">
            <Text fw={600}>
              Citas por cerrar en el período visible ({pendingClosure.length})
            </Text>
            {pendingClosure.map((appointment) => (
              <Group key={appointment.id} justify="space-between">
                <Text size="sm">
                  {new Date(appointment.appointmentStartDate).toLocaleString()}{" "}
                  · {appointment.patient?.firstName}{" "}
                  {appointment.patient?.lastName}
                </Text>
                <Button
                  size="xs"
                  variant="light"
                  onClick={() => {
                    setSelectedAppointment(appointment);
                    setIsViewModalOpen(true);
                  }}
                >
                  Resolver cita
                </Button>
              </Group>
            ))}
          </Stack>
        </Paper>
      )}

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
              events={combinedEvents}
              slotEventOverlap={!(canViewAvailability && showAvailability)}
              selectMirror={true}
              selectable={true}
              select={handleSelectRange}
              datesSet={handleDatesSet}
              eventClick={handleEventClick}
              displayEventEnd
              eventTimeFormat={{
                hour: "2-digit",
                minute: "2-digit",
                hour12: false,
              }}
              eventContent={(info) => {
                if (info.event.extendedProps.specialistAvailability) {
                  return (
                    <div className="specialist-availability-content">
                      <span>{info.event.title}</span>
                      <span className="specialist-availability-time">
                        {info.timeText}
                      </span>
                      {info.event.extendedProps.reason && (
                        <span>{String(info.event.extendedProps.reason)}</span>
                      )}
                    </div>
                  );
                }
                const appointment = info.event.extendedProps.fullAppointment as
                  | Appointment
                  | undefined;
                if (!appointment) return;
                const online = appointment.appointmentMode === "ONLINE";
                const status = APPOINTMENT_STATUSES[appointment.status];
                return (
                  <div
                    className="appointment-content"
                    title={`${info.timeText} · ${info.event.title} · ${online ? "Virtual" : "Presencial"} · ${status.label}`}
                  >
                    <span className="appointment-time">{info.timeText}</span>
                    <span className="appointment-name">
                      <span
                        className="appointment-mode"
                        aria-label={online ? "Virtual" : "Presencial"}
                      >
                        {online ? "V" : "P"}
                      </span>{" "}
                      {info.event.title}
                    </span>
                    <span className="appointment-status-label">
                      {status.marker} {status.label}
                    </span>
                  </div>
                );
              }}
            />
          </div>
        </Paper>
      }

      {/* View Appointment Modal */}
      {selectedAppointment && isViewModalOpen && (
        <AppointmentViewModal
          appointment={selectedAppointment}
          onEdit={() => handleEditAppointment(selectedAppointment)}
          onChanged={(updated) => {
            setSelectedAppointment(updated);
            setRefreshKey((k) => k + 1);
          }}
          onClose={() => {
            setIsViewModalOpen(false);
            setSelectedAppointment(null);
          }}
        />
      )}

      {/* Create Appointment Modal */}
      <CreateAppointmentModal
        key={editingAppointmentId ?? "create"}
        open={isCreateModalOpen}
        editing={editingAppointmentId !== null}
        saving={savingAppointment}
        specialists={specialists}
        locations={
          editingLocation &&
          !locations.some(
            (location) => String(location.id) === String(editingLocation.id),
          )
            ? [...locations, editingLocation]
            : locations
        }
        formData={createFormData}
        onFormDataChange={setCreateFormData}
        onClose={() => {
          if (savingAppointment) return;
          setIsCreateModalOpen(false);
          setEditingAppointmentId(null);
          setEditingLocation(null);
          setCreateFormData(EMPTY_CREATE_FORM);
        }}
        onSubmit={handleSaveAppointment}
      />
    </Stack>
  );
}

export interface AppointmentViewModalProps {
  appointment: Appointment;
  onClose: () => void;
  onEdit: () => void;
  onChanged: (appointment: Appointment) => void;
}
