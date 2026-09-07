import { useEffect, useState, type FormEvent, type KeyboardEvent } from 'react'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import interactionPlugin from '@fullcalendar/interaction'
import timeGridPlugin from '@fullcalendar/timegrid'
import type { DateSelectArg, DatesSetArg, EventClickArg } from '@fullcalendar/core'
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined'
import { patientService } from '../services/patientService'
import { specialistService } from '../services/specialistService'
import { locationService } from '../services/locationService'
import type { CreatePatient } from '../types/create-patient'
import type { Specialist } from '../data/http/specialistsApi'
import type { Location } from '../data/http/locationsApi'

type SessionEvent = {
  id: string
  title: string
  start: string
  end: string
  notes?: string
  tags?: string[]
  color?: string
}

type AppointmentPlan = {
  price: string
  currency: string
  sessionType: string
  selectedLocationId: string
  selectedSessions: SessionEvent[]
  selectedSpecialistId: string
}

type TagInputProps = {
  tags: string[]
  onChange: (tags: string[]) => void
}

function TagInput({ tags, onChange }: TagInputProps) {
  const [draft, setDraft] = useState('')

  function addTag(value: string) {
    const tag = value.trim()
    if (!tag || tags.some((currentTag) => currentTag.toLowerCase() === tag.toLowerCase())) return
    onChange([...tags, tag])
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === ',' || event.key === 'Enter') {
      event.preventDefault()
      addTag(draft)
      setDraft('')
      return
    }

    if (event.key === 'Backspace' && !draft && tags.length > 0) {
      onChange(tags.slice(0, -1))
    }
  }

  function handleChange(value: string) {
    if (value.includes(',')) {
      const parts = value.split(',')
      parts.slice(0, -1).forEach(addTag)
      setDraft(parts.at(-1) ?? '')
      return
    }

    setDraft(value)
  }

  return (
    <div className="tag-input">
      <div className="tag-list">
        {tags.map((tag) => (
          <span className="tag-chip" key={tag}>
            {tag}
            <button type="button" aria-label={`Eliminar etiqueta ${tag}`} onClick={() => onChange(tags.filter((currentTag) => currentTag !== tag))}>×</button>
          </span>
        ))}
        <input
          value={draft}
          onChange={(event) => handleChange(event.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={() => {
            addTag(draft)
            setDraft('')
          }}
          placeholder={tags.length ? 'Añadir etiqueta' : 'Ej. evaluación'}
          aria-label="Nueva etiqueta"
        />
      </div>
    </div>
  )
}

function formatLocalDateTime(date: Date) {
  const pad = (value: number) => String(value).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

function buildSpecialistAvailabilityWindow(start: Date, end: Date) {
  const inclusiveEnd = new Date(end)
  inclusiveEnd.setMilliseconds(inclusiveEnd.getMilliseconds() - 1)

  return {
    startDate: formatLocalDateTime(start),
    endDate: formatLocalDateTime(inclusiveEnd),
  }
}

export function PatientPage() {
  const [patients, setPatients] = useState<CreatePatient[]>([])
  const [specialists, setSpecialists] = useState<Specialist[]>([])
  const [locations, setLocations] = useState<Location[]>([])
  const [specialistAvailability, setSpecialistAvailability] = useState<SessionEvent[]>([])
  const [calendarDateRange, setCalendarDateRange] = useState<{ start: Date; end: Date } | null>(null)
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null)
  const [sessionNotes, setSessionNotes] = useState('')
  const [sessionTags, setSessionTags] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [error, setError] = useState('')
  const [appointmentPlan, setAppointmentPlan] = useState<AppointmentPlan>({
    price: '110',
    currency: 'PEN',
    sessionType: '',
    selectedLocationId: '',
    selectedSessions: [],
    selectedSpecialistId: '',
  })

  useEffect(() => {
    patientService
      .getAll()
      .then(setPatients)
      .catch((requestError: Error) => setError(requestError.message))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (!showForm) return

    specialistService
      .getAll()
      .then(setSpecialists)
      .catch((requestError: Error) => {
        setError(requestError.message)
      })
  }, [showForm])

  useEffect(() => {
    if (appointmentPlan.sessionType !== 'PRESENCIAL') {
      setLocations([])
      return
    }

    locationService
      .getAll()
      .then(setLocations)
      .catch((requestError: Error) => {
        setError(requestError.message)
      })
  }, [appointmentPlan.sessionType])

  useEffect(() => {
    if (!appointmentPlan.selectedSpecialistId || !calendarDateRange) {
      setSpecialistAvailability([])
      return
    }

    const { startDate, endDate } = buildSpecialistAvailabilityWindow(calendarDateRange.start, calendarDateRange.end)

    specialistService
      .getAppointmentsBySpecialistId(appointmentPlan.selectedSpecialistId, startDate, endDate)
      .then((appointments) => {
        const calendarEvents = appointments.map((appointment) => ({
          id: `existing-${appointment.id}`,
          title: appointment.patient ? `${appointment.patient.firstName ?? ''} ${appointment.patient.lastName ?? ''}`.trim() || 'Cita ocupada' : 'Cita ocupada',
          start: appointment.appointmentStartDate,
          end: appointment.appointmentEndDate,
          notes: appointment.notes ?? '',
          tags: [],
          color: '#d97706',
        }))

        setSpecialistAvailability(calendarEvents)
      })
      .catch((requestError: Error) => {
        setError(requestError.message)
      })
  }, [appointmentPlan.selectedSpecialistId, calendarDateRange])

  const currentSessionCount = appointmentPlan.selectedSessions.length
  const fullCalendarEvents = [...specialistAvailability, ...appointmentPlan.selectedSessions]

  function handleSessionSelection(selection: DateSelectArg) {
    const sessionId = `session-${Date.now()}-${Math.random().toString(16).slice(2)}`
    const nextSessionNumber = appointmentPlan.selectedSessions.length + 1

    setAppointmentPlan((current) => ({
      ...current,
      selectedSessions: [
        ...current.selectedSessions,
        {
          id: sessionId,
          title: `Sesión ${nextSessionNumber}`,
          start: selection.startStr,
          end: selection.endStr,
          notes: '',
          tags: [],
          color: '#2563eb',
        },
      ],
    }))
  }

  function handleSessionEdit(clickInfo: EventClickArg) {
    const session = [
      ...appointmentPlan.selectedSessions,
      ...specialistAvailability,
    ].find((item) => item.id === clickInfo.event.id)
    if (!session) return

    setEditingSessionId(session.id)
    setSessionNotes(session.notes ?? '')
    setSessionTags(session.tags ?? [])
  }

  function handleSessionModalClose() {
    setEditingSessionId(null)
    setSessionNotes('')
    setSessionTags([])
  }

  async function handleSessionDelete() {
    if (!editingSessionId) return

    const confirmed = window.confirm('¿Deseas eliminar esta sesión?')
    if (!confirmed) return

    if (editingSessionId.startsWith('existing-')) {
      if (!appointmentPlan.selectedSpecialistId) return

      const appointmentId = editingSessionId.replace('existing-', '')

      try {
        await specialistService.deleteAppointmentBySpecialistId(
          appointmentPlan.selectedSpecialistId,
          appointmentId,
        )
      } catch (requestError) {
        setError(requestError instanceof Error ? requestError.message : 'No se pudo eliminar la cita')
        return
      }
    }

    setAppointmentPlan((current) => ({
      ...current,
      selectedSessions: current.selectedSessions.filter((session) => session.id !== editingSessionId),
    }))
    setSpecialistAvailability((current) => current.filter((session) => session.id !== editingSessionId))
    handleSessionModalClose()
  }

  function handleSessionModalSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!editingSessionId) return

    const tags = sessionTags

    setAppointmentPlan((current) => ({
      ...current,
      selectedSessions: current.selectedSessions.map((session) => ({
        ...session,
        ...(session.id === editingSessionId ? {
          title: `${session.title.split(' · ')[0]}${tags.length ? ` · ${tags.join(', ')}` : ''}`,
          notes: sessionNotes.trim(),
          tags,
        } : {}),
      })),
    }))
    setSpecialistAvailability((current) => current.map((session) => ({
      ...session,
      ...(session.id === editingSessionId ? {
        title: `${session.title.split(' · ')[0]}${tags.length ? ` · ${tags.join(', ')}` : ''}`,
        notes: sessionNotes.trim(),
        tags,
      } : {}),
    })))
    handleSessionModalClose()
  }

  function handleCalendarDatesSet(dateInfo: DatesSetArg) {
    setCalendarDateRange({
      start: dateInfo.view.currentStart,
      end: dateInfo.view.currentEnd,
    })
  }

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
            <label className="form-field form-field-wide">
              <span>Notas</span>
              <textarea name="notes" rows={3} placeholder="Informacion relevante para la atencion" />
            </label>

            <div className="appointment-plan form-field-wide">
              <div className="appointment-plan-header">
                <h3>Plan de citas</h3>
              </div>

              <div className="appointment-plan-grid">
                <label className="form-field">
                  <span>Tarifa por sesión</span>
                  <div className="inline-price-inputs">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={appointmentPlan.price}
                      onChange={(event) => setAppointmentPlan((current) => ({ ...current, price: event.target.value }))}
                    />
                    <select
                      value={appointmentPlan.currency}
                      onChange={(event) => setAppointmentPlan((current) => ({ ...current, currency: event.target.value }))}
                    >
                      <option value="EUR">EUR</option>
                      <option value="USD">USD</option>
                      <option value="GBP">GBP</option>
                    </select>
                  </div>
                </label>

                <label className="form-field">
                  <span>Tipo sesión</span>
                  <select
                    required
                    value={appointmentPlan.sessionType}
                    onChange={(event) => setAppointmentPlan((current) => ({
                      ...current,
                      sessionType: event.target.value,
                      selectedLocationId: event.target.value === 'PRESENCIAL' ? current.selectedLocationId : '',
                    }))}
                  >
                    <option value="">Selecciona el tipo de sesión</option>
                    <option value="VIRTUAL">Virtual</option>
                    <option value="PRESENCIAL">Presencial</option>
                  </select>
                </label>

                {appointmentPlan.sessionType === 'PRESENCIAL' && (
                  <label className="form-field form-field-wide">
                    <span>Locación</span>
                    <select
                      required
                      value={appointmentPlan.selectedLocationId}
                      onChange={(event) => setAppointmentPlan((current) => ({
                        ...current,
                        selectedLocationId: event.target.value,
                      }))}
                    >
                      <option value="">Selecciona una locación</option>
                      {locations.map((location) => (
                        <option key={location.id} value={location.id}>
                          {location.name} - {location.hallName} ({location.address})
                        </option>
                      ))}
                    </select>
                  </label>
                )}

                <label className="form-field form-field-wide">
                  <span>Especialista</span>
                  <select
                    value={appointmentPlan.selectedSpecialistId}
                    onChange={(event) => setAppointmentPlan((current) => ({
                      ...current,
                      selectedSpecialistId: event.target.value,
                    }))}
                  >
                    <option value="">Selecciona un especialista</option>
                    {specialists.map((specialist) => (
                      <option key={specialist.id} value={specialist.id}>
                        {specialist.firstName} {specialist.lastName}
                      </option>
                    ))}
                  </select>
                </label>

              </div>

              <div className="appointment-preview">
                <div className="appointment-preview-header">
                  <h4>Calendario de sesiones</h4>
                  <span>{currentSessionCount} sesiones</span>
                </div>

                <div className="session-counter-panel">
                  <strong>{currentSessionCount}</strong>
                  <span>sesiones registradas</span>
                </div>

                <div className="calendar-wrap">
                  {!appointmentPlan.selectedSpecialistId ? (
                    <p className="status-message">Selecciona un especialista para ver su agenda disponible.</p>
                  ) : (
                    <FullCalendar
                      plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                      initialView="timeGridWeek"
                      headerToolbar={{ left: 'prev,next today', center: 'title', right: 'dayGridMonth,timeGridWeek,timeGridDay' }}
                      buttonText={{ today: 'Hoy', month: 'Mes', week: 'Semana', day: 'Día' }}
                      locale="es"
                      firstDay={1}
                      allDaySlot={false}
                      slotMinTime="08:00:00"
                      slotMaxTime="20:00:00"
                      height="auto"
                      selectable
                      editable
                      selectMirror
                      events={fullCalendarEvents}
                      datesSet={handleCalendarDatesSet}
                      select={handleSessionSelection}
                      eventClick={handleSessionEdit}
                    />
                  )}
                </div>
              </div>
            </div>

            <div className="form-actions form-field-wide">
              <button className="button button-secondary" type="button" onClick={() => setShowForm(false)}>Cancelar</button>
              <button className="button button-primary" type="submit">Guardar paciente</button>
            </div>
          </form>
        </section>
      )}

      {editingSessionId && (
        <div className="modal-backdrop" role="presentation" onMouseDown={handleSessionModalClose}>
          <section
            className="session-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="session-modal-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="session-modal-header">
              <div>
                <p className="eyebrow">Sesión seleccionada</p>
                <h2 id="session-modal-title">Detalles de la sesión</h2>
              </div>
              <button className="modal-close" type="button" aria-label="Cerrar" onClick={handleSessionModalClose}>×</button>
            </div>
            <form className="session-modal-form" onSubmit={handleSessionModalSubmit}>
              <label className="form-field">
                <span>Notas adicionales</span>
                <textarea
                  rows={4}
                  value={sessionNotes}
                  onChange={(event) => setSessionNotes(event.target.value)}
                  placeholder="Agrega información relevante para esta sesión"
                />
              </label>
              <label className="form-field">
                <span>Etiquetas</span>
                <TagInput tags={sessionTags} onChange={setSessionTags} />
                <small className="field-hint">Pulsa coma o Enter para crear una etiqueta.</small>
              </label>
              <div className="form-actions session-modal-actions">
                <button
                  className="button button-danger-icon"
                  type="button"
                  aria-label="Eliminar sesión"
                  title="Eliminar sesión"
                  onClick={handleSessionDelete}
                >
                  <DeleteOutlinedIcon aria-hidden="true" />
                </button>
                <button className="button button-secondary" type="button" onClick={handleSessionModalClose}>Cancelar</button>
                <button className="button button-primary" type="submit">Guardar cambios</button>
              </div>
            </form>
          </section>
        </div>
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
                <tr key={patient.patientId}><td><strong>{patient.firstName} {patient.lastName}</strong></td><td>{patient.email || 'Sin correo'}</td><td>{patient.birthdate || 'Sin fecha'}</td></tr>
              ))}</tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  )
}
