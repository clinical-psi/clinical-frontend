import { useEffect, useState } from "react";
import {
  ActionIcon, Alert, Badge, Button, Container, Group, Loader, Pagination,
  Select, Stack, Table, Text, TextInput, Title,
} from "@mantine/core";
import { IconEdit, IconTrash } from "@tabler/icons-react";
import { useConfirm, useToast } from "../../components/feedback/feedbackContext";
import { useRoles } from "../../hooks/useRoles";
import type { Location } from "../../data/http/locationsApi";
import { locationService } from "../../services/locationService";
import { LocationEditForm } from "./LocationEditForm";

const PAGE_SIZE = 10;

export function LocationsPage() {
  const { can } = useRoles();
  const canManage = can("locations.manage");
  const [locations, setLocations] = useState<Location[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<Location["status"] | undefined>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const toast = useToast();
  const confirm = useConfirm();

  useEffect(() => {
    if (!canManage || showForm) return;
    let cancelled = false;
    locationService.browse({ q: query, page: page - 1, size: PAGE_SIZE, ...(status ? { status } : {}) })
      .then((result) => {
        if (cancelled) return;
        const lastPage = Math.max(1, result.totalPages);
        if (page > lastPage) {
          setPage(lastPage);
          return;
        }
        setLocations(result.content);
        setTotal(result.totalElements);
        setError("");
      })
      .catch((err: Error) => {
        if (!cancelled) {
          setError(err.message);
          setLocations([]);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [canManage, showForm, page, query, status, refreshKey]);

  function closeForm() {
    setShowForm(false);
    setEditingId(null);
    setLoading(true);
  }

  function deactivate(location: Location) {
    void confirm({
      title: "Dar de baja sede",
      message: `¿Deseas dar de baja a la sede ${location.name}? Las citas existentes se conservarán.`,
      confirmLabel: "Dar de baja",
      destructive: true,
      onConfirm: async () => {
        await locationService.deactivate(location.id);
        toast.success("Sede dada de baja satisfactoriamente");
        setLoading(true);
        setRefreshKey((key) => key + 1);
      },
    });
  }

  if (!canManage) return null;

  return (
    <Container size="lg" py="xl">
      {showForm ? (
        <LocationEditForm
          key={editingId ?? "new"}
          locationId={editingId}
          onCancel={closeForm}
          onSaved={(message) => {
            closeForm();
            toast.success(message);
          }}
        />
      ) : (
        <>
          <Group justify="space-between" mb="lg">
            <div>
              <Title order={1}>Sedes</Title>
              <Text c="dimmed" size="sm">Total: {total} sedes</Text>
            </div>
            <Button onClick={() => { setEditingId(null); setShowForm(true); }}>
              Nueva Sede
            </Button>
          </Group>
          {error && <Alert title="Error" color="red" mb="md">{error}</Alert>}
          <Stack gap="md">
            <form onSubmit={(event) => {
              event.preventDefault();
              setLoading(true);
              setPage(1);
              setQuery(search.trim());
              setRefreshKey((key) => key + 1);
            }}>
              <Group align="flex-end">
                <TextInput
                  type="search"
                  name="search_query_locations"
                  aria-label="Buscar sedes"
                  autoComplete="off"
                  placeholder="Buscar por nombre, oficina o dirección"
                  value={search}
                  onChange={(event) => setSearch(event.currentTarget.value)}
                  style={{ flex: 1 }}
                />
                <Select
                  aria-label="Estado de la sede"
                  placeholder="Todos los estados"
                  data={[{ value: "ACTIVE", label: "Activa" }, { value: "INACTIVE", label: "Inactiva" }]}
                  value={status ?? null}
                  clearable
                  onChange={(value) => {
                    setLoading(true);
                    setPage(1);
                    setStatus(value === "ACTIVE" || value === "INACTIVE" ? value : undefined);
                  }}
                />
                <Button type="submit" variant="default">Buscar</Button>
              </Group>
            </form>
            {loading ? (
              <Group justify="center" mt="xl"><Loader /></Group>
            ) : locations.length === 0 ? (
              <Alert title="Sin resultados">
                {query || status
                  ? "No hay sedes que coincidan con tu búsqueda."
                  : "No hay sedes registradas. Haz clic en 'Nueva Sede' para crear una."}
              </Alert>
            ) : (
              <>
                <Table.ScrollContainer minWidth={700}>
                  <Table striped highlightOnHover verticalSpacing="sm">
                    <Table.Thead>
                      <Table.Tr>
                        <Table.Th>Sede</Table.Th>
                        <Table.Th>Oficinas o salas</Table.Th>
                        <Table.Th>Dirección</Table.Th>
                        <Table.Th>Estado</Table.Th>
                        <Table.Th w={120}>Acciones</Table.Th>
                      </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                      {locations.map((location) => (
                        <Table.Tr key={location.id}>
                          <Table.Td><strong>{location.name}</strong></Table.Td>
                          <Table.Td>{location.halls.map((hall) => hall.hallName).join(", ") || "—"}</Table.Td>
                          <Table.Td>{location.address || "—"}</Table.Td>
                          <Table.Td>
                            <Badge variant="light" size="sm" color={location.status === "ACTIVE" ? "green" : "gray"}>
                              {location.status === "ACTIVE" ? "Activa" : "Inactiva"}
                            </Badge>
                          </Table.Td>
                          <Table.Td>
                            <Group gap="xs">
                              <ActionIcon
                                size="sm" variant="default" title="Editar sede" aria-label="Editar sede"
                                onClick={() => { setEditingId(location.id); setShowForm(true); }}
                              ><IconEdit size={16} /></ActionIcon>
                              {location.status === "ACTIVE" && (
                                <ActionIcon
                                  size="sm" color="red" variant="default" title="Dar de baja" aria-label="Dar de baja"
                                  onClick={() => deactivate(location)}
                                ><IconTrash size={16} /></ActionIcon>
                              )}
                            </Group>
                          </Table.Td>
                        </Table.Tr>
                      ))}
                    </Table.Tbody>
                  </Table>
                </Table.ScrollContainer>
                {Math.ceil(total / PAGE_SIZE) > 1 && (
                  <Group justify="center" mt="md">
                    <Pagination value={page} total={Math.ceil(total / PAGE_SIZE)} onChange={(value) => { setLoading(true); setPage(value); }} />
                  </Group>
                )}
              </>
            )}
          </Stack>
        </>
      )}
    </Container>
  );
}
