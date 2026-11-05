import "./App.css";
import { useState } from "react";
import { AuthProvider } from "./presentation/contexts/AuthProvider";
import { ProtectedRoute } from "./presentation/ProtectedRoute";
import { AppLayout } from "./presentation/AppLayout";
import { AppointmentsPage } from "./presentation/appointments/AppointmentsPage";
import { PatientPage } from "./presentation/patients/PatientPage";
import { SpecialistsPage } from "./presentation/specialists/SpecialistsPage";
import { SettingsPage } from "./presentation/configuration/SettingsPage";
import { MyAvailabilityPage } from "./presentation/availability/MyAvailabilityPage";
import { useRoles } from "./hooks/useRoles";
import type { MenuItemId } from "./config/permissions";

function AppContent() {
  const { menuItems } = useRoles();
  const [selectedItem, setSelectedItem] = useState<MenuItemId>("patients");
  // Si el menú elegido no está permitido para el rol, se cae al primero visible.
  const activeItem = menuItems.some((item) => item.id === selectedItem)
    ? selectedItem
    : menuItems[0]?.id;

  return (
    <AppLayout activeItem={activeItem ?? ""} onNavigate={setSelectedItem}>
      {activeItem === "patients" && <PatientPage />}
      {activeItem === "specialists" && <SpecialistsPage />}
      {activeItem === "appointments" && <AppointmentsPage />}
      {activeItem === "availability" && <MyAvailabilityPage />}
      {activeItem === "settings" && <SettingsPage />}
    </AppLayout>
  );
}

function App() {
  return (
    <AuthProvider>
      <ProtectedRoute>
        <AppContent />
      </ProtectedRoute>
    </AuthProvider>
  );
}

export default App;
