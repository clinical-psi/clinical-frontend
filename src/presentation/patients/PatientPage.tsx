import { useEffect, useState } from "react";
import { useRoles } from "../../hooks/useRoles";
import {
  Table,
  TextInput,
  ActionIcon,
  Pagination,
  Stack,
  Button,
  Group,
  Title,
  Text,
  Container,
  Loader,
  Alert,
  Badge,
} from "@mantine/core";
import { IconEdit, IconTrash } from "@tabler/icons-react";
import { patientService } from "../../services/patientService";
import type { GetPatient } from "../../types/get-patient";
import { PatientEditForm } from "./PatientEditForm";
import { PATIENT_STATUS_STYLES } from "../../util/constants";

export function PatientPage() {
  const { roleNames, can } = useRoles();
  const [patients, setPatients] = useState<GetPatient[]>([]);
  const [patientPage, setPatientPage] = useState(1);
  const [patientTotal, setPatientTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [patientNameFilter, setPatientNameFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingPatientId, setEditingPatientId] = useState<string | null>(null);

  const patientPageSize = 10;
  const totalPages = Math.ceil(patientTotal / patientPageSize);

  useEffect(() => {
    setLoading(true);
    patientService
      .getAll(roleNames, patientNameFilter, patientPage - 1, patientPageSize)
      .then((result) => {
        setPatients(result.content);
        setPatientTotal(result.totalElements);
        setError("");
      })
      .catch((requestError: Error) => {
        setError(requestError.message);
        setPatients([]);
      })
      .finally(() => setLoading(false));
  }, [roleNames, patientPage, patientNameFilter]);

  function getFilteredPatients(): GetPatient[] {
    return patients.filter((patient) => {
      const fullName = `${patient.firstName} ${patient.lastName}`.toLowerCase();
      return fullName.includes(patientNameFilter.toLowerCase());
    });
  }

  function handlePatientEdit(patient: GetPatient) {
    setEditingPatientId(patient.id ?? patient.patientId ?? null);
    setShowForm(true);
  }

  async function handlePatientDeactivate(patient: GetPatient) {
    const patientId = patient.id ?? patient.patientId;
    if (
      !patientId ||
      !window.confirm(
        `¿Deseas dar de baja a ${patient.firstName} ${patient.lastName}?`,
      )
    )
      return;

    try {
      await patientService.deactivate(patientId);
      const refreshedPage = await patientService.getAll(
        roleNames,
        patientNameFilter,
        patientPage - 1,
        patientPageSize,
      );
      setPatients(refreshedPage.content);
      setPatientTotal(refreshedPage.totalElements);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "No se pudo dar de baja al paciente",
      );
    }
  }

  if (showForm) {
    return (
      <Container size="lg" py="xl">
        <PatientEditForm
          editingPatientId={editingPatientId}
          onCancel={() => {
            setShowForm(false);
            setEditingPatientId(null);
            const refreshPage = async () => {
              const result = await patientService.getAll(
                roleNames,
                patientNameFilter,
                patientPage - 1,
                patientPageSize,
              );
              setPatients(result.content);
              setPatientTotal(result.totalElements);
            };
            refreshPage();
          }}
          onSaveSuccess={() => {
            setLoading(true);
            setShowForm(false);
            setEditingPatientId(null);
            const refreshPage = async () => {
              const result = await patientService.getAll(
                roleNames,
                patientNameFilter,
                patientPage - 1,
                patientPageSize,
              );
              setPatients(result.content);
              setPatientTotal(result.totalElements);
              setLoading(false);
            };
            refreshPage();
          }}
        />
      </Container>
    );
  }

  return (
    <Container size="lg" py="xl">
      <Group justify="space-between" mb="lg">
        <div>
          <Title order={1}>Pacientes</Title>
          <Text c="dimmed" size="sm">
            Total: {patientTotal} pacientes
          </Text>
        </div>
        <Button
          onClick={() => {
            setEditingPatientId(null);
            setShowForm(true);
          }}
        >
          Nuevo Paciente
        </Button>
      </Group>

      {error && (
        <Alert title="Error" color="red" mb="md">
          {error}
        </Alert>
      )}

      <Stack gap="md">
        {loading ? (
          <Group justify="center" mt="xl">
            <Loader />
          </Group>
        ) : getFilteredPatients().length === 0 ? (
          <Alert title="Sin resultados">
            {patientNameFilter
              ? "No hay pacientes que coincidan con tu búsqueda"
              : "No hay pacientes registrados. Haz clic en 'Nuevo Paciente' para crear uno."}
          </Alert>
        ) : (
          <>
            <form
              onSubmit={(event) => {
                event.preventDefault();
                setPatientPage(1);
                setPatientNameFilter(search.trim());
              }}
            >
              <Group>
                <TextInput
                  type="search"
                  name="search_query_patients"
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
            <Table.ScrollContainer minWidth={700}>
              <Table striped highlightOnHover verticalSpacing="sm">
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Paciente</Table.Th>
                    <Table.Th>Correo</Table.Th>
                    <Table.Th>Celular</Table.Th>
                    <Table.Th></Table.Th>
                    <Table.Th w={120}>Acciones</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {getFilteredPatients().map((patient) => (
                    <Table.Tr key={patient.id ?? patient.patientId}>
                      <Table.Td>
                        <strong>
                          {patient.firstName} {patient.lastName}
                        </strong>
                      </Table.Td>
                      <Table.Td>{patient.email || "—"}</Table.Td>
                      <Table.Td>{patient.phoneNumber || "—"}</Table.Td>
                      <Table.Td>
                        <Badge
                          key={PATIENT_STATUS_STYLES[patient.status]?.label}
                          variant="light"
                          size="sm"
                          color={
                            PATIENT_STATUS_STYLES[patient.status]?.color ??
                            "gray"
                          }
                        >
                          {PATIENT_STATUS_STYLES[patient.status]?.label ??
                            "Desconocido"}
                        </Badge>
                      </Table.Td>
                      <Table.Td>
                        <Group gap="xs">
                          <ActionIcon
                            size="sm"
                            variant="default"
                            onClick={() => handlePatientEdit(patient)}
                            title="Editar paciente"
                          >
                            <IconEdit size={16} />
                          </ActionIcon>
                          {can("patients.deactivate") && (
                            <ActionIcon
                              size="sm"
                              color="red"
                              variant="default"
                              onClick={() => handlePatientDeactivate(patient)}
                              title="Dar de baja"
                            >
                              <IconTrash size={16} />
                            </ActionIcon>
                          )}
                        </Group>
                      </Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </Table.ScrollContainer>

            {totalPages > 1 && (
              <Group justify="center" mt="md">
                <Pagination
                  value={patientPage}
                  onChange={setPatientPage}
                  total={totalPages}
                />
              </Group>
            )}
          </>
        )}
      </Stack>
    </Container>
  );
}
