import { useState } from "react";
import {
  Alert,
  Container,
  Group,
  Loader,
  Paper,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import { availabilityService } from "../../services/availabilityService";
import { useOnceEffect } from "../../hooks/useOnceEffect";
import type { Specialist } from "../../types/get-specialist";
import { SpecialistAvailabilityManager } from "./SpecialistAvailabilityManager";

export function MyAvailabilityPage() {
  const [specialist, setSpecialist] = useState<Specialist | null>(null);
  const [error, setError] = useState("");

  useOnceEffect(() => {
    availabilityService
      .getMySpecialistProfile()
      .then(setSpecialist)
      .catch((err: Error) => setError(err.message));
  });

  return (
    <Container size="lg" py="xl">
      <Stack gap="lg">
        <div>
          <Title order={1}>Mi disponibilidad</Title>
          <Text c="dimmed" size="sm">
            Configura tu horario de atención y bloquea los periodos en los que
            no puedes recibir pacientes.
          </Text>
        </div>
        <Paper shadow="sm" p="lg" radius="md">
          {error ? (
            <Alert color="red" title="No se pudo cargar tu perfil">
              {error}
            </Alert>
          ) : specialist ? (
            <SpecialistAvailabilityManager specialistId={String(specialist.id)} />
          ) : (
            <Group justify="center" py="xl">
              <Loader size="sm" />
            </Group>
          )}
        </Paper>
      </Stack>
    </Container>
  );
}
