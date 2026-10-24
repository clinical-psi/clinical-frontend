import { useState, useEffect } from "react";
import {
  Container,
  Button,
  Group,
  Title,
  Text,
  Loader,
  Alert,
  Card,
  Grid,
  Table,
  Badge,
  SegmentedControl,
  Paper,
  ActionIcon,
  Avatar,
} from "@mantine/core";
import { IconSquares, IconList, IconEdit } from "@tabler/icons-react";
import { specialistService } from "../../services/specialistService";
import type { Specialist } from "../../data/http/specialistsApi";
import { SpecialistEditForm } from "./SpecialistEditForm";

export function SpecialistsPage() {
  const [specialists, setSpecialists] = useState<Specialist[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingSpecialistId, setEditingSpecialistId] = useState<string | null>(
    null,
  );

  const [viewMode, setViewMode] = useState<"cards" | "list">("cards");

  useEffect(() => {
    loadSpecialists();
  }, []);

  async function loadSpecialists() {
    setLoading(true);
    setError("");
    try {
      const data = await specialistService.getAll();
      setSpecialists(data);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Error al cargar especialistas";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  // Mostrar formulario cuando está en modo creación
  if (showForm) {
    return (
      <Container size="lg" py="xl">
        <SpecialistEditForm
          editingSpecialistId={editingSpecialistId ?? undefined}
          onCancel={() => {
            setShowForm(false);
            setEditingSpecialistId(null);
            loadSpecialists();
          }}
          onSaveSuccess={() => {
            setShowForm(false);
            setEditingSpecialistId(null);
            loadSpecialists();
          }}
        />
      </Container>
    );
  }

  function handleSpecialistEdit(specialist: Specialist): void {
    setEditingSpecialistId(specialist.id);
    setShowForm(true);
  }

  return (
    <Container size="lg" py="xl">
      {/* Header */}
      <Group justify="space-between" mb="lg">
        <div>
          <Title order={1}>Especialistas</Title>
          <Text c="dimmed" size="sm">
            Total: {specialists.length} especialistas
          </Text>
        </div>
        <Button
          onClick={() => {
            setEditingSpecialistId(null);
            setShowForm(true);
          }}
        >
          Nuevo Especialista
        </Button>
      </Group>

      {/* Error Alert */}
      {error && (
        <Alert title="Error" color="red" mb="md" onClose={() => setError("")}>
          {error}
        </Alert>
      )}

      {/* View Mode Toggle */}
      {!loading && specialists.length > 0 && (
        <Paper p="md" mb="lg" bg="var(--surface)">
          <Group justify="space-between">
            <Text size="sm" fw={500}>
              Vista
            </Text>
            <SegmentedControl
              value={viewMode}
              onChange={(value) => setViewMode(value as "cards" | "list")}
              data={[
                {
                  value: "cards",
                  label: (
                    <Group gap={8}>
                      <IconSquares size={16} />
                      <span>Cards</span>
                    </Group>
                  ),
                },
                {
                  value: "list",
                  label: (
                    <Group gap={8}>
                      <IconList size={16} />
                      <span>Lista</span>
                    </Group>
                  ),
                },
              ]}
            />
          </Group>
        </Paper>
      )}

      {/* Loading State */}
      {loading ? (
        <Group justify="center" mt="xl">
          <Loader />
        </Group>
      ) : specialists.length === 0 ? (
        <Alert title="Sin especialistas">
          No hay especialistas registrados. Haz clic en "Nuevo Especialista"
          para crear uno.
        </Alert>
      ) : viewMode === "cards" ? (
        /* Cards View */
        <Grid>
          {specialists.map((specialist) => (
            <Grid.Col key={specialist.id} span={{ base: 12, sm: 6, md: 4 }}>
              <Card shadow="sm" padding="lg" radius="md" withBorder>
                <Card.Section withBorder inheritPadding py="md">
                  <Group justify="space-between" align="flex-start">
                    <Group gap="sm" wrap="nowrap">
                      <Avatar
                        src={specialist.photoUrl}
                        size={56}
                        radius="xl"
                        name={`${specialist.firstName} ${specialist.lastName}`}
                      />
                      <div>
                        <Title order={3}>{specialist.firstName}</Title>
                        <Text size="sm" c="dimmed">
                          {specialist.lastName}
                        </Text>
                      </div>
                    </Group>
                    <Group gap="xs" wrap="nowrap">
                      {specialist.shortName && (
                        <Badge size="sm" variant="light">
                          {specialist.shortName}
                        </Badge>
                      )}
                      <ActionIcon
                        size="sm"
                        variant="default"
                        onClick={() => handleSpecialistEdit(specialist)}
                        title="Editar especialista"
                      >
                        <IconEdit size={16} />
                      </ActionIcon>
                    </Group>
                  </Group>
                </Card.Section>

                <Text size="xs" c="dimmed" mb="md">
                  ID: {specialist.id}
                </Text>
              </Card>
            </Grid.Col>
          ))}
        </Grid>
      ) : (
        /* List View */
        <Table striped highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Nombre</Table.Th>
              <Table.Th>Apellido</Table.Th>
              <Table.Th>Alias</Table.Th>
              <Table.Th w={120}>Acciones</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {specialists.map((specialist) => (
              <Table.Tr key={specialist.id}>
                <Table.Td>
                  <strong>{specialist.firstName}</strong>
                </Table.Td>
                <Table.Td>{specialist.lastName}</Table.Td>
                <Table.Td>
                  {specialist.shortName ? (
                    <Badge size="sm">{specialist.shortName}</Badge>
                  ) : (
                    "—"
                  )}
                </Table.Td>
                <Table.Td>
                  <ActionIcon
                    size="sm"
                    variant="default"
                    onClick={() => handleSpecialistEdit(specialist)}
                    title="Editar especialista"
                  >
                    <IconEdit size={16} />
                  </ActionIcon>
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      )}
    </Container>
  );
}
