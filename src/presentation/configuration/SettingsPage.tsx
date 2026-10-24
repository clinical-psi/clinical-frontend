import { Container, Tabs, Title } from "@mantine/core";
import { UsersPanel } from "./../configuration/UsersPanel";
import { ChangePasswordForm } from "./ChangePasswordForm";
import { useRoles } from "../../hooks/useRoles";

export function SettingsPage() {
  const { can } = useRoles();
  const canManageUsers = can("settings.users");
  return (
    <Container size="lg" py="xl">
      <Title order={1} mb="lg">
        Configuración
      </Title>
      <Tabs defaultValue={canManageUsers ? "users" : "password"}>
        <Tabs.List mb="lg">
          {canManageUsers && <Tabs.Tab value="users">Usuarios</Tabs.Tab>}
          <Tabs.Tab value="password">Cambiar contraseña</Tabs.Tab>
        </Tabs.List>
        {canManageUsers && (
          <Tabs.Panel value="users">
            <UsersPanel />
          </Tabs.Panel>
        )}
        <Tabs.Panel value="password">
          <ChangePasswordForm />
        </Tabs.Panel>
      </Tabs>
    </Container>
  );
}
