import { useCallback, useEffect, useState } from "react";
import { ROLE_STYLES, ROLE_OPTIONS } from "../../util/constants";
import {
  ActionIcon,
  Alert,
  Badge,
  Button,
  Group,
  Loader,
  Modal,
  MultiSelect,
  Pagination,
  Stack,
  Table,
  Text,
  TextInput,
} from "@mantine/core";
import { IconEdit, IconUserOff } from "@tabler/icons-react";
import { userService } from "../../services/userService";
import type { CreateUser } from "../../types/create-user";
import type { GetUser } from "../../types/get-user";

const PAGE_SIZE = 10;

function RoleBadges({ roles }: { roles?: { roleName: string }[] }) {
  if (!roles || roles.length === 0) {
    return (
      <Text size="sm" c="dimmed">
        Sin roles
      </Text>
    );
  }
  return (
    <Group gap={4}>
      {roles.map((role) => {
        const style = ROLE_STYLES[role.roleName];
        return (
          <Badge
            key={role.roleName}
            variant="light"
            size="sm"
            color={style?.color ?? "gray"}
          >
            {style?.label ?? role.roleName}
          </Badge>
        );
      })}
    </Group>
  );
}

export function UsersPanel() {
  const [users, setUsers] = useState<GetUser[]>([]);
  const [totalPages, setTotalPages] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [editing, setEditing] = useState<GetUser | null>(null);
  const [form, setForm] = useState({ firstName: "", lastName: "", email: "" });
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [deactivating, setDeactivating] = useState<GetUser | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await userService.getAll(query, page - 1, PAGE_SIZE);
      setUsers(data.content);
      setTotalPages(data.totalPages);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Error al cargar usuarios",
      );
    } finally {
      setLoading(false);
    }
  }, [query, page]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  // El listado no trae roles: se obtienen del detalle para no perderlos al guardar
  async function buildRequest(
    user: GetUser,
    values: { firstName: string; lastName: string; email: string },
    isActive: boolean,
    rolesOverride?: string[],
  ): Promise<CreateUser> {
    let names = rolesOverride;
    if (!names) {
      const detail = await userService.getById(user.userId);
      names = (detail.roles ?? []).map((role) => role.roleName);
    }
    return {
      ...values,
      isActive,
      roles: names.map((roleName) => ({ roleName })),
    };
  }

  function openEdit(user: GetUser) {
    setEditing(user);
    setForm({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
    });
    setSelectedRoles((user.roles ?? []).map((role) => role.roleName));
    userService
      .getById(user.userId)
      .then((detail) =>
        setSelectedRoles((detail.roles ?? []).map((role) => role.roleName)),
      )
      .catch(() => {});
  }

  async function handleSave() {
    if (!editing) return;
    if (!form.firstName.trim() || !form.lastName.trim() || !form.email.trim()) {
      setError("Nombre, apellido y email son requeridos");
      return;
    }
    if (selectedRoles.length === 0) {
      setError("Selecciona al menos un rol");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const request = await buildRequest(
        editing,
        {
          firstName: form.firstName.trim(),
          lastName: form.lastName.trim(),
          email: form.email.trim(),
        },
        true,
        selectedRoles,
      );
      await userService.update(editing.userId, request);
      setEditing(null);
      await load();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "No se pudo guardar el usuario",
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDeactivate() {
    if (!deactivating) return;
    setSaving(true);
    setError("");
    try {
      const request = await buildRequest(
        deactivating,
        {
          firstName: deactivating.firstName,
          lastName: deactivating.lastName,
          email: deactivating.email,
        },
        false,
      );
      await userService.update(deactivating.userId, request);
      setDeactivating(null);
      await load();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "No se pudo dar de baja al usuario",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <Stack gap="md">
      <form
        onSubmit={(event) => {
          event.preventDefault();
          setPage(1);
          setQuery(search.trim());
        }}
      >
        <Group>
          <TextInput
            type="search"
            name="search_query_users"
            autoComplete="off"
            placeholder="Buscar por nombres, apellidos o email"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ flex: 1 }}
          />
          <Button type="submit" variant="default">
            Buscar
          </Button>
        </Group>
      </form>

      {error && (
        <Alert color="red" title="Error" onClose={() => setError("")}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Group justify="center" mt="xl">
          <Loader />
        </Group>
      ) : users.length === 0 ? (
        <Alert title="Sin usuarios">No se encontraron usuarios.</Alert>
      ) : (
        <Table striped highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Nombre</Table.Th>
              <Table.Th>Apellido</Table.Th>
              <Table.Th>Email</Table.Th>
              <Table.Th>Roles</Table.Th>
              <Table.Th w={120}>Acciones</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {users.map((user) => (
              <Table.Tr key={user.userId}>
                <Table.Td>{user.firstName}</Table.Td>
                <Table.Td>{user.lastName}</Table.Td>
                <Table.Td>{user.email}</Table.Td>
                <Table.Td>
                  <RoleBadges roles={user.roles} />
                </Table.Td>
                <Table.Td>
                  <Group gap="xs" wrap="nowrap">
                    <ActionIcon
                      size="sm"
                      variant="default"
                      title="Editar usuario"
                      onClick={() => openEdit(user)}
                    >
                      <IconEdit size={16} />
                    </ActionIcon>
                    <ActionIcon
                      size="sm"
                      variant="default"
                      color="red"
                      title="Dar de baja"
                      onClick={() => setDeactivating(user)}
                    >
                      <IconUserOff size={16} />
                    </ActionIcon>
                  </Group>
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      )}

      {totalPages > 1 && (
        <Group justify="center">
          <Pagination value={page} onChange={setPage} total={totalPages} />
        </Group>
      )}

      <Modal
        opened={!!editing}
        onClose={() => setEditing(null)}
        title="Editar usuario"
      >
        <Stack gap="md">
          <TextInput
            label="Nombre"
            required
            value={form.firstName}
            onChange={(e) => setForm({ ...form, firstName: e.target.value })}
          />
          <TextInput
            label="Apellido"
            required
            value={form.lastName}
            onChange={(e) => setForm({ ...form, lastName: e.target.value })}
          />
          <TextInput
            label="Email"
            type="email"
            required
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
          <MultiSelect
            label="Roles"
            required
            data={ROLE_OPTIONS}
            value={selectedRoles}
            onChange={setSelectedRoles}
            placeholder="Selecciona roles"
          />
          <Group justify="flex-end">
            <Button variant="default" onClick={() => setEditing(null)}>
              Cancelar
            </Button>
            <Button loading={saving} onClick={handleSave}>
              Guardar
            </Button>
          </Group>
        </Stack>
      </Modal>

      <Modal
        opened={!!deactivating}
        onClose={() => setDeactivating(null)}
        title="Dar de baja"
      >
        <Stack gap="md">
          <Text>
            ¿Dar de baja a {deactivating?.firstName} {deactivating?.lastName}?
          </Text>
          <Group justify="flex-end">
            <Button variant="default" onClick={() => setDeactivating(null)}>
              Cancelar
            </Button>
            <Button color="red" loading={saving} onClick={handleDeactivate}>
              Dar de baja
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Stack>
  );
}
