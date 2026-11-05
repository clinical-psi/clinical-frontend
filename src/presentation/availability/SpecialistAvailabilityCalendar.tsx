import { useEffect, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import interactionPlugin from "@fullcalendar/interaction";
import timeGridPlugin from "@fullcalendar/timegrid";
import dayGridPlugin from "@fullcalendar/daygrid";
import type {
  DateSelectArg,
  DatesSetArg,
  EventInput,
} from "@fullcalendar/core";
import { Alert, Group, Loader, LoadingOverlay, Stack, Text } from "@mantine/core";
import { availabilityService } from "../../services/availabilityService";
import { specialistService } from "../../services/specialistService";
import { calculateDateRange, toISOStringWithTimezone } from "../../util/utils";
import { AvailabilityLegend } from "./AvailabilityLegend";

export function SpecialistAvailabilityCalendar({
  specialistId,
  refreshKey,
  onSelectRange,
}: {
  specialistId: string;
  refreshKey: number;
  onSelectRange?: (start: Date, end: Date, allDay: boolean) => void;
}) {
  const [range, setRange] = useState<{ start: string; end: string } | null>(
    null,
  );
  const [events, setEvents] = useState<EventInput[]>([]);
  const [loadedKey, setLoadedKey] = useState("");
  const [error, setError] = useState("");
  const requestKey = range ? `${range.start}|${range.end}|${refreshKey}` : "";
  const loading = Boolean(range) && loadedKey !== requestKey;

  useEffect(() => {
    if (!range) return;
    let cancelled = false;
    const start = toISOStringWithTimezone(new Date(range.start));
    const end = toISOStringWithTimezone(new Date(range.end));
    Promise.all([
      availabilityService.getCalendarEvents({
        start,
        end,
        specialistIds: [specialistId],
      }),
      specialistService
        .getAppointmentsBySpecialistId(specialistId, start, end)
        .catch(() => []),
    ])
      .then(([availability, appointments]) => {
        if (cancelled) return;
        setEvents([
          ...availability,
          ...appointments.map((appointment) => ({
            id: `appointment-${appointment.id}`,
            title:
              `${appointment.patient?.firstName ?? ""} ${appointment.patient?.lastName ?? ""}`.trim() ||
              "Cita",
            start: appointment.appointmentStartDate,
            end: appointment.appointmentEndDate,
            classNames: ["fc-appointment-readonly"],
          })),
        ]);
        setError("");
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoadedKey(requestKey);
      });
    return () => {
      cancelled = true;
    };
  }, [range, specialistId, requestKey]);

  function handleDatesSet(info: DatesSetArg) {
    setRange((prev) => calculateDateRange(info, prev) ?? prev);
  }

  function handleSelect(info: DateSelectArg) {
    info.view.calendar.unselect();
    onSelectRange?.(info.start, info.end, info.allDay);
  }

  return (
    <Stack gap="sm">
      <Group justify="space-between" wrap="wrap" gap="xs">
        <AvailabilityLegend />
        {onSelectRange && (
          <Text size="xs" c="dimmed">
            Arrastra sobre el calendario para bloquear o habilitar un horario.
          </Text>
        )}
      </Group>
      {error && (
        <Alert color="red" withCloseButton onClose={() => setError("")}>
          {error}
        </Alert>
      )}
      <div className="availability-calendar" style={{ position: "relative" }}>
        <LoadingOverlay visible={loading} loaderProps={{ children: <Loader /> }} />
        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView="timeGridWeek"
          headerToolbar={{
            left: "prev,next today",
            center: "title",
            right: "dayGridMonth,timeGridWeek",
          }}
          buttonText={{ today: "Hoy", month: "Mes", week: "Semana" }}
          locale="es"
          firstDay={1}
          allDaySlot={false}
          slotMinTime="06:00:00"
          slotMaxTime="24:00:00"
          scrollTime="08:00:00"
          height={640}
          nowIndicator
          selectable={Boolean(onSelectRange)}
          selectMirror
          events={events}
          datesSet={handleDatesSet}
          select={handleSelect}
        />
      </div>
    </Stack>
  );
}
