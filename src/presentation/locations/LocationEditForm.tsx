import { useEffect, useState, type FormEvent } from "react";
import { ActionIcon, Alert, Button, Group, Loader, Paper, Stack, Text, TextInput, Title } from "@mantine/core";
import { IconPlus, IconTrash } from "@tabler/icons-react";
import type { WriteLocationRequest } from "../../data/http/locationsApi";
import { locationService } from "../../services/locationService";
import { useConfirm } from "../../components/feedback/feedbackContext";

type Props = {
  locationId: number | null;
  onCancel: () => void;
  onSaved: (message: string) => void;
};

type HallRow = { key: string; id?: number; hallName: string };
type LocationForm = Omit<WriteLocationRequest, "halls"> & { halls: HallRow[] };

const newHallRow = (): HallRow => ({ key: crypto.randomUUID(), hallName: "" });

export function LocationEditForm({ locationId, onCancel, onSaved }: Props) {
  const [form, setForm] = useState<LocationForm>(() => ({
    name: "", halls: [newHallRow()], address: "",
  }));
  const [loading, setLoading] = useState(locationId !== null);
  const [loadError, setLoadError] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const confirm = useConfirm();

  useEffect(() => {
    if (locationId === null) return;
    let cancelled = false;
    locationService.getById(locationId)
      .then((location) => {
        if (!cancelled) {
          setForm({
            name: location.name ?? "",
            halls: location.halls.map((hall) => ({
              key: `hall-${hall.id}`, id: hall.id, hallName: hall.hallName,
            })),
            address: location.address ?? "",
          });
        }
      })
      .catch((err: Error) => {
        if (!cancelled) setLoadError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [locationId]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving || loading || loadError) return;
    const request = {
      name: form.name.trim(),
      halls: form.halls.map(({ id, hallName }) => ({ id, hallName: hallName.trim() })),
      address: form.address.trim(),
    };
    if (!request.name || !request.address || request.halls.length === 0 ||
      request.halls.some((hall) => !hall.hallName)) {
      setError("Completa el nombre, la dirección y al menos una sala de la sede.");
      return;
    }
    if (new Set(request.halls.map((hall) => hall.hallName.toLocaleLowerCase())).size !== request.halls.length) {
      setError("Los nombres de las salas de una sede no pueden repetirse.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      if (locationId === null) {
        await locationService.create(request);
      } else {
        await locationService.update(locationId, request);
      }
      onSaved(locationId === null
        ? "Sede registrada satisfactoriamente"
        : "Sede actualizada satisfactoriamente");
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo guardar la sede.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Paper shadow="sm" p="lg" radius="md" mb="lg">
      <Group justify="space-between" mb="lg">
        <Title order={2}>{locationId === null ? "Nueva Sede" : "Editar Sede"}</Title>
        <Button variant="default" onClick={onCancel} disabled={saving}>
          Volver a sedes
        </Button>
      </Group>
      {loading ? (
        <Group justify="center"><Loader /></Group>
      ) : loadError ? (
        <Alert color="red" title="No se pudo cargar la sede">{loadError}</Alert>
      ) : (
        <form onSubmit={handleSubmit}>
          <fieldset disabled={saving} style={{ border: 0, padding: 0, margin: 0, minWidth: 0 }}>
            <Stack gap="md">
              {error && <Alert color="red" title="Error">{error}</Alert>}
              <TextInput
                label="Nombre de la sede"
                placeholder="Nombre del edificio o nombre comercial"
                value={form.name}
                onChange={(event) => setForm({ ...form, name: event.currentTarget.value })}
                maxLength={255}
                required
              />
              <TextInput
                label="Dirección completa"
                placeholder="Calle, número, distrito y ciudad"
                value={form.address}
                onChange={(event) => setForm({ ...form, address: event.currentTarget.value })}
                maxLength={255}
                required
              />
              <Stack gap="sm">
                <Group justify="space-between">
                  <Title order={4}>Oficinas o salas</Title>
                  <Button
                    variant="light"
                    leftSection={<IconPlus size={16} />}
                    disabled={saving}
                    onClick={() => setForm({ ...form, halls: [...form.halls, newHallRow()] })}
                  >
                    Agregar sala
                  </Button>
                </Group>
                <Text size="sm" c="dimmed">
                  La sede debe tener al menos una sala. Al retirar una sala se conserva en las citas existentes.
                </Text>
                {form.halls.map((hall, index) => (
                  <Paper key={hall.key} withBorder p="md" radius="md">
                    <Group align="flex-end" wrap="nowrap">
                      <TextInput
                        label={`Sala ${index + 1}`}
                        placeholder="Ej. Oficina 402"
                        value={hall.hallName}
                        onChange={(event) => {
                          const hallName = event.currentTarget.value;
                          setForm({ ...form, halls: form.halls.map((item, position) =>
                            position === index ? { ...item, hallName } : item) });
                        }}
                        maxLength={255}
                        style={{ flex: 1 }}
                        disabled={saving}
                        required
                      />
                      <ActionIcon
                        variant="default"
                        color="red"
                        size="lg"
                        title="Retirar sala"
                        aria-label={`Retirar sala ${index + 1}`}
                        disabled={saving || form.halls.length <= 1}
                        onClick={() => {
                          const remove = () => setForm((current) => ({
                            ...current, halls: current.halls.filter((item) => item.key !== hall.key),
                          }));
                          if (!hall.id) return remove();
                          void confirm({
                            title: "Retirar sala",
                            message: `¿Deseas retirar la sala ${hall.hallName}? Las citas existentes se conservarán.`,
                            confirmLabel: "Retirar",
                            destructive: true,
                            onConfirm: remove,
                          });
                        }}
                      >
                        <IconTrash size={16} />
                      </ActionIcon>
                    </Group>
                  </Paper>
                ))}
              </Stack>
              <Group justify="flex-end">
                <Button variant="default" onClick={onCancel} disabled={saving}>Cancelar</Button>
                <Button type="submit" loading={saving}>Guardar sede</Button>
              </Group>
            </Stack>
          </fieldset>
        </form>
      )}
    </Paper>
  );
}
