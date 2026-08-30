import './App.css'
import { useState } from 'react'
import { AppLayout } from './presentation/AppLayout'
import { AppointmentsPage } from './presentation/AppointmentsPage'
import { PatientPage } from './presentation/PatientPage'

function App() {
  const [activeItem, setActiveItem] = useState('patients')

  return (
    <AppLayout activeItem={activeItem} onNavigate={setActiveItem}>
      {activeItem === 'patients' ? <PatientPage /> : <AppointmentsPage />}
    </AppLayout>
  )
}

export default App