import { useEffect, useState } from 'react'
import { patientService } from '../services/patientService'
import type { CreatePatient } from '../types/create-patient'

export function PatientPage() {
  const [patients, setPatients] = useState<CreatePatient[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)

  useEffect(() => {
    patientService
      .getAll()
      .then(setPatients)
      .catch((requestError: Error) => setError(requestError.message))
      .finally(() => setLoading(false))
  }, [])

  return (
    <main className="app-shell">
      <header className="page-header">
        <div>
          <p className="eyebrow">Terapia Cercana</p>
          <h1>Pacientes</h1>
          <p className="page-intro">Consulta y administra la informacion basica de tus pacientes.</p>
        </div>
        <button className="button button-primary" type="button" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cerrar formulario' : 'Nuevo paciente'}
        </button>
      </header>

      {showForm && (
        <section className="panel form-panel" aria-labelledby="new-patient-title">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Registro</p>
              <h2 id="new-patient-title">Nuevo paciente</h2>
            </div>
            <span className="required-note">* Campos obligatorios</span>
          </div>
          <form className="form-grid" onSubmit={(event) => event.preventDefault()}>
            <label className="form-field"><span>Nombre *</span><input required name="firstName" placeholder="Ej. Ana" /></label>
            <label className="form-field"><span>Apellido *</span><input required name="lastName" placeholder="Ej. Garcia" /></label>
            <label className="form-field"><span>Correo electronico</span><input type="email" name="email" placeholder="ana@correo.com" /></label>
            <label className="form-field"><span>Fecha de nacimiento</span><input type="date" name="birthdate" /></label>
            <label className="form-field form-field-wide"><span>Notas</span><textarea name="notes" rows={3} placeholder="Informacion relevante para la atencion" /></label>
            <div className="form-actions form-field-wide">
              <button className="button button-secondary" type="button" onClick={() => setShowForm(false)}>Cancelar</button>
              <button className="button button-primary" type="submit">Guardar paciente</button>
            </div>
          </form>
        </section>
      )}

      <section className="panel" aria-labelledby="patient-list-title">
        <div className="panel-heading">
          <div><h2 id="patient-list-title">Listado de pacientes</h2><p className="panel-caption">Personas registradas en el sistema</p></div>
          <span className="count-badge">{patients.length}</span>
        </div>
        {loading && <p className="status-message">Cargando pacientes...</p>}
        {error && <p className="status-message status-error" role="alert">{error}</p>}
        {!loading && !error && patients.length === 0 && <p className="status-message">No hay pacientes registrados.</p>}
        {!loading && !error && patients.length > 0 && (
          <div className="table-wrap">
            <table>
              <thead><tr><th>Paciente</th><th>Correo</th><th>Fecha de nacimiento</th></tr></thead>
              <tbody>{patients.map((patient) => (
                <tr key={patient.patientUuid}><td><strong>{patient.firstName} {patient.lastName}</strong></td><td>{patient.email || 'Sin correo'}</td><td>{patient.birthdate || 'Sin fecha'}</td></tr>
              ))}</tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  )
}
