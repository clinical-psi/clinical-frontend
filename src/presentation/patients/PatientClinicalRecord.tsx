import { useCallback, useEffect, useState } from "react";
import {
  Accordion, Alert, Badge, Button, Group, Loader, Modal, Paper,
  Select, Stack, Text, Textarea, TextInput, Title,
} from "@mantine/core";
import { clinicalRecordService } from "../../services/clinicalRecordService";
import { patientService } from "../../services/patientService";
import {
  ANAMNESIS_SECTIONS, PROGRESS_FIELDS,
  type Anamnesis, type AnamnesisFields, type ClinicalAccess,
  type ProgressNote, type ProgressNoteInput,
} from "../../types/clinical-record";
import type { PatientAppointment } from "../../types/get-patient";

type Props = { patientId: string; section: "anamnesis" | "progress" };

const today = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
};
const errorMessage = (error: unknown) =>
  error instanceof Error ? error.message : "No se pudo completar la operación clínica.";

function AnamnesisContent({ fields }: { fields: AnamnesisFields }) {
  return (
    <Accordion multiple>
      {ANAMNESIS_SECTIONS.map((section) => (
        <Accordion.Item key={section.title} value={section.title}>
          <Accordion.Control>{section.title}</Accordion.Control>
          <Accordion.Panel>
            <Stack>
              {section.fields.map(([key, label]) => (
                <div key={key}>
                  <Text fw={600} size="sm">{label}</Text>
                  <Text style={{ whiteSpace: "pre-wrap" }}>{fields[key] || "No registrado"}</Text>
                </div>
              ))}
            </Stack>
          </Accordion.Panel>
        </Accordion.Item>
      ))}
    </Accordion>
  );
}

export function PatientClinicalRecord({ patientId, section }: Props) {
  const [access, setAccess] = useState<ClinicalAccess | null>(null);
  const [records, setRecords] = useState<Anamnesis[]>([]);
  const [notes, setNotes] = useState<ProgressNote[]>([]);
  const [appointments, setAppointments] = useState<PatientAppointment[]>([]);
  const [appointmentPage, setAppointmentPage] = useState(0);
  const [hasMoreAppointments, setHasMoreAppointments] = useState(false);
  const [loadingAppointments, setLoadingAppointments] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editor, setEditor] = useState<{
    record: Anamnesis | null; assessmentDate: string; fields: AnamnesisFields;
  } | null>(null);
  const [dirty, setDirty] = useState(false);
  const [revisions, setRevisions] = useState<Anamnesis[] | null>(null);
  const [noteEditor, setNoteEditor] = useState<ProgressNoteInput | null>(null);
  const [confirmation, setConfirmation] = useState<{
    title: string; message: string; run: () => Promise<void>;
  } | null>(null);
  const selected = records.find((record) => String(record.id) === selectedId);

  const load = useCallback(async () => {
    const permissions = await clinicalRecordService.access(patientId);
    const anamneses = permissions.canRead && section === "anamnesis"
      ? await clinicalRecordService.anamneses(patientId) : [];
    const progressNotes = permissions.canRead && section === "progress"
      ? await clinicalRecordService.progressNotes(patientId) : [];
    return { permissions, anamneses, progressNotes };
  }, [patientId, section]);

  const applyLoaded = useCallback((result: Awaited<ReturnType<typeof load>>) => {
    setAccess(result.permissions);
    setRecords(result.anamneses);
    setNotes(result.progressNotes);
    setError("");
    setSelectedId((current) =>
      result.anamneses.some((record) => String(record.id) === current)
        ? current : result.anamneses[0] ? String(result.anamneses[0].id) : null);
  }, []);

  useEffect(() => {
    let active = true;
    load().then((result) => {
      if (active) applyLoaded(result);
    }).catch((error: unknown) => {
      if (active) { setAccess(null); setError(errorMessage(error)); }
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [load, applyLoaded]);

  async function reload() {
    setLoading(true);
    try {
      applyLoaded(await load());
    } catch (error) {
      setAccess(null);
      setError(errorMessage(error));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!dirty && !noteEditor) return;
    const preventLeave = (event: BeforeUnloadEvent) => { event.preventDefault(); };
    window.addEventListener("beforeunload", preventLeave);
    return () => window.removeEventListener("beforeunload", preventLeave);
  }, [dirty, noteEditor]);

  async function perform(action: () => Promise<void>) {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await action();
    } catch (error) {
      setError(errorMessage(error));
    } finally {
      setBusy(false);
    }
  }

  function closeEditor() {
    if (dirty) {
      setConfirmation({
        title: "Descartar cambios",
        message: "Hay cambios sin guardar. ¿Deseas descartarlos?",
        run: async () => { setEditor(null); setDirty(false); },
      });
    } else {
      setEditor(null);
    }
  }

  async function saveDraft() {
    if (!editor) return;
    await perform(async () => {
      const input = { assessmentDate: editor.assessmentDate, fields: editor.fields };
      const saved = editor.record
        ? await clinicalRecordService.update(patientId, editor.record.id,
          { ...input, version: editor.record.version })
        : await clinicalRecordService.create(patientId, input);
      setRecords((current) => [saved, ...current.filter((record) => record.id !== saved.id)]);
      setSelectedId(String(saved.id));
      setEditor(null);
      setDirty(false);
      setNotice("Borrador guardado.");
    });
  }

  async function openNote(note?: ProgressNote) {
    setNoteEditor({
      appointmentId: note?.appointmentId ?? "",
      sessionDate: note?.sessionDate ?? today(),
      subjective: note?.subjective ?? "",
      objective: note?.objective ?? "",
      assessment: note?.assessment ?? "",
      plan: note?.plan ?? "",
      ...(note ? { correctsNoteId: note.id } : {}),
    });
    setAppointments([]);
    setAppointmentPage(0);
    await loadAppointments(0);
  }

  async function loadAppointments(page: number) {
    setLoadingAppointments(true);
    try {
      const result = await patientService.getAppointmentsByPatientId(patientId, page, 50);
      setAppointments((current) => page === 0 ? result.content : [...current, ...result.content]);
      setAppointmentPage(page);
      setHasMoreAppointments(page + 1 < result.totalPages);
    } catch (error) {
      setError(errorMessage(error));
    } finally {
      setLoadingAppointments(false);
    }
  }

  const appointmentOptions = appointments.map((appointment) => ({
    value: String(appointment.id),
    label: `${new Date(appointment.appointmentStartDate).toLocaleString()}${appointment.specialistShortName ? ` - ${appointment.specialistShortName}` : ""}`,
  }));
  if (noteEditor?.appointmentId && !appointmentOptions.some(
    (option) => option.value === String(noteEditor.appointmentId))) {
    appointmentOptions.push({
      value: String(noteEditor.appointmentId),
      label: `Cita ${noteEditor.appointmentId}`,
    });
  }

  return (
    <Stack mt="lg">
      {error && <Alert color="red" title="No se pudo completar la operación">{error}</Alert>}
      {notice && <Alert color="green">{notice}</Alert>}
      <Group justify="space-between">
        <Title order={3}>{section === "anamnesis" ? "Anamnesis psicológica" : "Evolución por sesión"}</Title>
        <Button variant="default" onClick={() => void reload()} disabled={busy || loading || !!editor || !!noteEditor}>
          Recargar
        </Button>
      </Group>
      {loading ? <Loader aria-label="Cargando historia clínica" /> : !access?.canRead ? (
        <Alert>No hay acceso al contenido clínico de este paciente.</Alert>
      ) : (
        <>
          {!access.canWrite && <Alert>Consulta de historia clínica. Tu perfil no permite editar este paciente.</Alert>}
          {section === "anamnesis" ? (
            <>
              <Text size="sm" c="dimmed">
                Cada evaluación conserva su fecha y autor. Los registros finalizados no se sobrescriben:
                una enmienda crea un nuevo borrador vinculado al original.
              </Text>
              {access.canWrite && (
                <Button onClick={() => {
                  setEditor({ record: null, assessmentDate: today(), fields: {} });
                  setDirty(false);
                }}>Nueva anamnesis</Button>
              )}
              {records.length === 0 ? <Text>No hay anamnesis registradas.</Text> : (
                <Select label="Evaluaciones e historial"
                  value={selectedId} onChange={setSelectedId}
                  data={records.map((record) => ({
                    value: String(record.id),
                    label: `${record.assessmentDate} - ${record.status === "DRAFT" ? "Borrador" : "Finalizada"} - #${record.id}${record.previousRecordId ? ` (enmienda de #${record.previousRecordId})` : ""}`,
                  }))} />
              )}
              {selected && (
                <Paper withBorder p="md">
                  <Stack>
                    <Group>
                      <Badge>{selected.status === "DRAFT" ? "Borrador" : "Finalizada"}</Badge>
                      <Text size="sm">Especialista #{selected.specialistId} · Versión {selected.version}</Text>
                    </Group>
                    <Text size="sm">
                      Evaluación: {selected.assessmentDate}. Creado por #{selected.createdByUserId}.
                      Última modificación: {new Date(selected.updatedAt).toLocaleString()} por #{selected.updatedByUserId}.
                    </Text>
                    {selected.finalizedAt && <Text size="sm">
                      Finalizada: {new Date(selected.finalizedAt).toLocaleString()} por #{selected.finalizedByUserId}.
                    </Text>}
                    <Group>
                      <Button variant="default" disabled={busy} onClick={() => void perform(async () => {
                        setRevisions(await clinicalRecordService.revisions(patientId, selected.id));
                      })}>Ver versiones guardadas</Button>
                      {access.canWrite && selected.status === "DRAFT" && (
                        <>
                          <Button onClick={() => {
                            setEditor({ record: selected, assessmentDate: selected.assessmentDate, fields: { ...selected.fields } });
                            setDirty(false);
                          }}>Editar borrador</Button>
                          <Button color="teal" disabled={busy} onClick={() => setConfirmation({
                            title: "Finalizar anamnesis",
                            message: "El registro quedará bloqueado. Cualquier corrección posterior será una enmienda y conservará el original.",
                            run: async () => {
                              const result = await clinicalRecordService.finalize(patientId, selected.id, selected.version);
                              setRecords((current) => current.map((record) => record.id === result.id ? result : record));
                              setNotice("Anamnesis finalizada.");
                            },
                          })}>Finalizar</Button>
                        </>
                      )}
                      {access.canWrite && selected.status === "FINALIZED" && (
                        <Button disabled={busy} onClick={() => setConfirmation({
                          title: "Crear enmienda",
                          message: "Se creará un borrador basado en esta evaluación, sin modificar el registro finalizado.",
                          run: async () => {
                            const result = await clinicalRecordService.amend(patientId, selected.id, selected.version);
                            setRecords((current) => [result, ...current]);
                            setSelectedId(String(result.id));
                            setNotice("Enmienda creada como borrador.");
                          },
                        })}>Crear enmienda</Button>
                      )}
                    </Group>
                    <AnamnesisContent fields={selected.fields} />
                  </Stack>
                </Paper>
              )}
            </>
          ) : (
            <>
              <Text size="sm" c="dimmed">
                Las notas se conservan sin sobrescritura. Para corregir una nota se agrega otra vinculada a la original.
              </Text>
              {access.canWrite && <Button disabled={busy} onClick={() => void openNote()}>Nueva nota de evolución</Button>}
              {notes.length === 0 && <Text>No hay notas de evolución registradas.</Text>}
              {notes.map((note) => (
                <Paper key={note.id} withBorder p="md">
                  <Stack gap="sm">
                    <Title order={4}>{note.sessionDate} · Cita #{note.appointmentId}</Title>
                    <Text size="sm" c="dimmed">
                      Especialista #{note.specialistId} · Registrada {new Date(note.createdAt).toLocaleString()} por #{note.createdByUserId}
                    </Text>
                    {note.correctsNoteId && <Badge>Corrección de la nota #{note.correctsNoteId}</Badge>}
                    {PROGRESS_FIELDS.map(([key, label]) => (
                      <div key={key}>
                        <Text fw={600}>{label}</Text>
                        <Text style={{ whiteSpace: "pre-wrap" }}>{note[key] || "No registrado"}</Text>
                      </div>
                    ))}
                    {access.canWrite && <Button variant="default" onClick={() => void openNote(note)}>Agregar corrección</Button>}
                  </Stack>
                </Paper>
              ))}
            </>
          )}
        </>
      )}
      <Modal opened={!!editor} onClose={closeEditor} size="xl"
        closeOnClickOutside={false} closeOnEscape={!busy} withCloseButton={!busy}
        title={editor?.record ? "Editar borrador de anamnesis" : "Nueva anamnesis"}>
        {editor && <form onSubmit={(event) => { event.preventDefault(); void saveDraft(); }}>
          <Stack>
            {error && <Alert color="red">{error}</Alert>}
            <TextInput label="Fecha de evaluación" type="date" required value={editor.assessmentDate}
              disabled={busy} onChange={(event) => {
                setEditor({ ...editor, assessmentDate: event.currentTarget.value }); setDirty(true);
              }} />
            <Text size="sm" c="dimmed">
              Un campo vacío significa «no registrado», no una respuesta negativa.
              Puedes indicar «No evaluado» o «Prefiere no responder» cuando corresponda.
            </Text>
            <Accordion multiple defaultValue={["Motivo de consulta e historia del problema"]}>
              {ANAMNESIS_SECTIONS.map((block) => (
                <Accordion.Item key={block.title} value={block.title}>
                  <Accordion.Control>{block.title}</Accordion.Control>
                  <Accordion.Panel>
                    <Stack>
                      {block.fields.map(([key, label]) => (
                        <Textarea key={key} label={label} autosize minRows={2} maxLength={10000}
                          disabled={busy} value={editor.fields[key] ?? ""}
                          onChange={(event) => {
                            setEditor({ ...editor, fields: { ...editor.fields, [key]: event.currentTarget.value } });
                            setDirty(true);
                          }} />
                      ))}
                    </Stack>
                  </Accordion.Panel>
                </Accordion.Item>
              ))}
            </Accordion>
            <Group justify="flex-end">
              <Button variant="default" disabled={busy} onClick={closeEditor}>Cancelar</Button>
              <Button type="submit" loading={busy}>Guardar borrador</Button>
            </Group>
          </Stack>
        </form>}
      </Modal>
      <Modal opened={!!noteEditor} onClose={() => {
        setConfirmation({
          title: "Descartar nota",
          message: "La nota no se ha guardado. ¿Deseas descartarla?",
          run: async () => { setNoteEditor(null); },
        });
      }} title={noteEditor?.correctsNoteId ? "Corrección de nota de evolución" : "Nueva nota de evolución"}
        size="lg" closeOnClickOutside={false} closeOnEscape={!busy} withCloseButton={!busy}>
        {noteEditor && <form onSubmit={(event) => {
          event.preventDefault();
          if (!PROGRESS_FIELDS.some(([key]) => noteEditor[key].trim())) {
            setError("Completa al menos un apartado clínico de la nota.");
            return;
          }
          void perform(async () => {
            const saved = await clinicalRecordService.addProgressNote(patientId, noteEditor);
            setNotes((current) => [saved, ...current]);
            setNoteEditor(null);
            setNotice("Nota de evolución registrada.");
          });
        }}>
          <Stack>
            {error && <Alert color="red">{error}</Alert>}
            <Select label="Sesión / cita" required searchable data={appointmentOptions}
              disabled={busy || !!noteEditor.correctsNoteId}
              value={String(noteEditor.appointmentId) || null} onChange={(value) => {
                const appointment = appointments.find((item) => String(item.id) === value);
                setNoteEditor({
                  ...noteEditor,
                  appointmentId: value ?? "",
                  sessionDate: appointment?.appointmentStartDate.slice(0, 10) ?? noteEditor.sessionDate,
                });
              }} />
            {loadingAppointments && <Loader size="sm" />}
            {!loadingAppointments && appointments.length === 0 && <Text size="sm">
              No se encontraron citas. Registra una cita para vincular la nota a una sesión.
            </Text>}
            <Button variant="subtle" loading={loadingAppointments} disabled={busy}
              onClick={() => void loadAppointments(hasMoreAppointments ? appointmentPage + 1 : 0)}>
              {hasMoreAppointments ? "Cargar más citas" : "Recargar citas"}
            </Button>
            <TextInput label="Fecha de sesión" type="date" required value={noteEditor.sessionDate}
              disabled={busy} onChange={(event) =>
                setNoteEditor({ ...noteEditor, sessionDate: event.currentTarget.value })} />
            {PROGRESS_FIELDS.map(([key, label]) => (
              <Textarea key={key} label={label} autosize minRows={3} maxLength={10000}
                disabled={busy} value={noteEditor[key]} onChange={(event) =>
                  setNoteEditor({ ...noteEditor, [key]: event.currentTarget.value })} />
            ))}
            <Button type="submit" loading={busy} disabled={!noteEditor.appointmentId}>
              Registrar nota definitiva
            </Button>
          </Stack>
        </form>}
      </Modal>
      <Modal opened={revisions !== null} onClose={() => setRevisions(null)} size="xl" title="Historial de versiones">
        <Stack>
          {revisions?.length === 0 && <Text>No hay versiones anteriores.</Text>}
          {revisions?.map((revision) => (
            <Paper key={`${revision.id}-${revision.version}`} withBorder p="md">
              <Text fw={600}>Versión {revision.version} · {revision.assessmentDate} · {revision.status === "DRAFT" ? "Borrador" : "Finalizada"}</Text>
              <Text size="sm">Guardada {new Date(revision.updatedAt).toLocaleString()} por #{revision.updatedByUserId}</Text>
              <AnamnesisContent fields={revision.fields} />
            </Paper>
          ))}
        </Stack>
      </Modal>
      <Modal opened={!!confirmation} onClose={() => !busy && setConfirmation(null)}
        title={confirmation?.title} closeOnClickOutside={!busy} closeOnEscape={!busy} withCloseButton={!busy}>
        <Stack>
          <Text>{confirmation?.message}</Text>
          {error && <Alert color="red">{error}</Alert>}
          <Group justify="flex-end">
            <Button variant="default" disabled={busy} onClick={() => setConfirmation(null)}>Cancelar</Button>
            <Button loading={busy} onClick={() => {
              if (confirmation) void perform(async () => {
                await confirmation.run(); setConfirmation(null);
              });
            }}>Confirmar</Button>
          </Group>
        </Stack>
      </Modal>
    </Stack>
  );
}
