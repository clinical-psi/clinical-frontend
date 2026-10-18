import "./App.css";
import { useState } from "react";
import { AuthProvider } from "./presentation/contexts/AuthProvider";
import { ProtectedRoute } from "./presentation/ProtectedRoute";
import { AppLayout } from "./presentation/AppLayout";
import { AppointmentsPage } from "./presentation/AppointmentsPage";
import { PatientPage } from "./presentation/PatientPage";
import { SpecialistsPage } from "./presentation/SpecialistsPage";

function AppContent() {
  const [activeItem, setActiveItem] = useState("patients");

  return (
    <AppLayout activeItem={activeItem} onNavigate={setActiveItem}>
      {activeItem === "patients" && <PatientPage />}
      {activeItem === "specialists" && <SpecialistsPage />}
      {activeItem === "appointments" && <AppointmentsPage />}
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
