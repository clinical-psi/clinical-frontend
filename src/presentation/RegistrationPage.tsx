import { useState, type FormEvent } from "react";
import { Alert, Button, Checkbox, Container, Group, Paper, PasswordInput, Stack, TextInput, Title } from "@mantine/core";
import { registerUser } from "../data/http/authApi";

export function RegistrationPage({ onBack }: { onBack: () => void }) {
  const [form, setForm] = useState({
    firstName: "", lastName: "", email: "", password: "", tenantName: "", specialist: false,
  });
  const [confirmation, setConfirmation] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [registered, setRegistered] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (saving) return;
    if (form.password !== confirmation) {
      setError("Las contraseñas no coinciden.");
      return;
    }
    setError("");
    setSaving(true);
    try {
      await registerUser({
        ...form, email: form.email.trim(), firstName: form.firstName.trim(),
        lastName: form.lastName.trim(), tenantName: form.tenantName.trim(),
      });
      setRegistered(true);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "No se pudo registrar la clínica.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Container size="xs" py="xl">
      <Paper shadow="sm" p="lg" radius="md">
        <Title order={2} mb="lg">Registrar mi clínica</Title>
        {registered ? (
          <Stack>
            <Alert color="green" title="Registro completado">
              Tu clínica y tu cuenta están listas. Ya puedes iniciar sesión.
            </Alert>
            <Button onClick={onBack}>Ir a iniciar sesión</Button>
          </Stack>
        ) : (
          <form onSubmit={submit}>
            <Stack>
              {error && <Alert color="red" title="Error">{error}</Alert>}
              <TextInput label="Nombre de la clínica" required maxLength={255} value={form.tenantName}
                onChange={(event) => setForm({ ...form, tenantName: event.currentTarget.value })} />
              <TextInput label="Nombre" required maxLength={100} value={form.firstName}
                onChange={(event) => setForm({ ...form, firstName: event.currentTarget.value })} />
              <TextInput label="Apellido" required maxLength={100} value={form.lastName}
                onChange={(event) => setForm({ ...form, lastName: event.currentTarget.value })} />
              <TextInput label="Correo electrónico" type="email" required maxLength={255} value={form.email}
                onChange={(event) => setForm({ ...form, email: event.currentTarget.value })} />
              <PasswordInput label="Contraseña" required minLength={6} maxLength={255} value={form.password}
                onChange={(event) => setForm({ ...form, password: event.currentTarget.value })} />
              <PasswordInput label="Confirmar contraseña" required value={confirmation}
                onChange={(event) => setConfirmation(event.currentTarget.value)} />
              <Checkbox label="También atenderé pacientes como especialista en esta clínica."
                checked={form.specialist}
                onChange={(event) => setForm({ ...form, specialist: event.currentTarget.checked })} />
              <Group justify="space-between">
                <Button variant="default" disabled={saving} onClick={onBack}>Volver</Button>
                <Button type="submit" loading={saving}>Registrar clínica</Button>
              </Group>
            </Stack>
          </form>
        )}
      </Paper>
    </Container>
  );
}
