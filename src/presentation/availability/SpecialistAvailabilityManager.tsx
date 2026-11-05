import { useState } from "react";
import { Stack, Tabs } from "@mantine/core";
import {
  IconCalendarEvent,
  IconCalendarOff,
  IconClockHour4,
} from "@tabler/icons-react";
import Snackbar from "@mui/material/Snackbar";
import MUIAlert from "@mui/material/Alert";
import type { Location } from "../../data/http/locationsApi";
import type { AvailabilityExceptionRequest } from "../../types/availability";
import { locationService } from "../../services/locationService";
import { availabilityService } from "../../services/availabilityService";
import { useOnceEffect } from "../../hooks/useOnceEffect";
import { WeeklyScheduleEditor } from "./WeeklyScheduleEditor";
import { AvailabilityExceptionsPanel } from "./AvailabilityExceptionsPanel";
import { SpecialistAvailabilityCalendar } from "./SpecialistAvailabilityCalendar";
import {
  AvailabilityExceptionModal,
  type AvailabilityExceptionFormDefaults,
} from "./AvailabilityExceptionModal";
import { addDays, toDateInput, toDateTimeInput } from "./availabilityUi";

type Toast = { message: string; severity: "success" | "error" } | null;

export function SpecialistAvailabilityManager({
  specialistId,
}: {
  specialistId: string;
}) {
  const [locations, setLocations] = useState<Location[]>([]);
  const [tab, setTab] = useState<string | null>("schedule");
  const [refreshKey, setRefreshKey] = useState(0);
  const [toast, setToast] = useState<Toast>(null);
  const [quickDefaults, setQuickDefaults] =
    useState<Partial<AvailabilityExceptionFormDefaults> | null>(null);
  const [quickKey, setQuickKey] = useState(0);

  useOnceEffect(() => {
    locationService
      .getAll()
      .then(setLocations)
      .catch(() => setLocations([]));
  });

  const notify = (message: string, severity: "success" | "error") =>
    setToast({ message, severity });
  const refresh = () => setRefreshKey((key) => key + 1);

  function handleCalendarSelect(start: Date, end: Date, allDay: boolean) {
    setQuickDefaults(
      allDay
        ? {
            allDay: true,
            startDate: toDateInput(start),
            endDate: toDateInput(addDays(end, -1)),
          }
        : {
            allDay: false,
            startDateTime: toDateTimeInput(start),
            endDateTime: toDateTimeInput(end),
          },
    );
    setQuickKey((key) => key + 1);
  }

  async function handleQuickSubmit(request: AvailabilityExceptionRequest) {
    const saved = await availabilityService.saveException(
      specialistId,
      request,
    );
    setQuickDefaults(null);
    refresh();
    notify(
      saved.type === "BLOCKED" && saved.overlappingAppointments > 0
        ? `Bloqueo guardado. Hay ${saved.overlappingAppointments} cita(s) dentro de este periodo que debes reprogramar.`
        : "Excepción guardada",
      saved.type === "BLOCKED" && saved.overlappingAppointments > 0
        ? "error"
        : "success",
    );
  }

  return (
    <Stack gap="md">
      <Tabs value={tab} onChange={setTab} keepMounted={false}>
        <Tabs.List>
          <Tabs.Tab value="schedule" leftSection={<IconClockHour4 size={16} />}>
            Horario semanal
          </Tabs.Tab>
          <Tabs.Tab value="exceptions" leftSection={<IconCalendarOff size={16} />}>
            Excepciones
          </Tabs.Tab>
          <Tabs.Tab value="calendar" leftSection={<IconCalendarEvent size={16} />}>
            Calendario
          </Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="schedule" pt="md">
          <WeeklyScheduleEditor
            specialistId={specialistId}
            locations={locations}
            onSaved={refresh}
            onNotify={notify}
          />
        </Tabs.Panel>
        <Tabs.Panel value="exceptions" pt="md">
          <AvailabilityExceptionsPanel
            specialistId={specialistId}
            locations={locations}
            onChanged={refresh}
            onNotify={notify}
          />
        </Tabs.Panel>
        <Tabs.Panel value="calendar" pt="md">
          <SpecialistAvailabilityCalendar
            specialistId={specialistId}
            refreshKey={refreshKey}
            onSelectRange={handleCalendarSelect}
          />
        </Tabs.Panel>
      </Tabs>

      {quickDefaults && (
        <AvailabilityExceptionModal
          key={quickKey}
          opened
          defaults={quickDefaults}
          locations={locations}
          onClose={() => setQuickDefaults(null)}
          onSubmit={handleQuickSubmit}
        />
      )}

      <Snackbar
        open={toast !== null}
        autoHideDuration={5000}
        onClose={() => setToast(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <MUIAlert
          severity={toast?.severity ?? "success"}
          onClose={() => setToast(null)}
        >
          {toast?.message}
        </MUIAlert>
      </Snackbar>
    </Stack>
  );
}
