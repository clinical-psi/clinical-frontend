import { useState } from 'react'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import interactionPlugin from '@fullcalendar/interaction'
import timeGridPlugin from '@fullcalendar/timegrid'
import type { DateSelectArg, EventClickArg } from '@fullcalendar/core'

export function AppointmentsPage() {
  return (
    <main className="app-shell">
      <header className="page-header">
        <div>
          <p className="eyebrow">Agenda</p>
          <h1>Citas</h1>
          <p className="page-intro">Organiza y consulta las sesiones del centro psicologico.</p>
        </div>
        <button className="button button-primary" type="button">Nueva cita</button>
      </header>

      <section className="panel calendar-panel" aria-labelledby="appointments-title">
        <div className="panel-heading">
          <div>
            <h2 id="appointments-title">Agenda de citas</h2>
            <p className="panel-caption">Selecciona un horario o abre una cita para consultarla.</p>
          </div>
        </div>
        <AppointmentsCalendar />
      </section>
    </main>
  )
}

function AppointmentsCalendar() {
  const [events, setEvents] = useState([
    { id: '1', title: 'Ana Garcia - Sesion inicial', start: '2026-08-25T10:00:00', end: '2026-08-25T11:00:00' },
    { id: '2', title: 'Carlos Lopez - Seguimiento', start: '2026-08-27T15:00:00', end: '2026-08-27T16:00:00' },
  ])

  function handleDateSelect(selection: DateSelectArg) {
    const title = window.prompt('Nombre o motivo de la cita')
    if (!title) return

    setEvents((currentEvents) => [
      ...currentEvents,
      { id: String(Date.now()), title, start: selection.startStr, end: selection.endStr },
    ])
  }

  function handleEventClick(clickInfo: EventClickArg) {
    window.alert(`Cita seleccionada: ${clickInfo.event.title}`)
  }

  return (
    <div className="calendar-wrap">
      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView="timeGridWeek"
        headerToolbar={{ left: 'prev,next today', center: 'title', right: 'dayGridMonth,timeGridWeek,timeGridDay' }}
        buttonText={{ today: 'Hoy', month: 'Mes', week: 'Semana', day: 'Dia' }}
        locale="es"
        firstDay={1}
        allDaySlot={false}
        slotMinTime="08:00:00"
        slotMaxTime="20:00:00"
        height="auto"
        selectable
        editable
        selectMirror
        events={events}
        select={handleDateSelect}
        eventClick={handleEventClick}
      />
    </div>
  )
}
