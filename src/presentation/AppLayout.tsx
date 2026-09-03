import type { ReactNode } from 'react'

type NavigationItem = {
  id: string
  label: string
  icon: string
}

type AppLayoutProps = {
  activeItem: string
  children: ReactNode
  onNavigate: (itemId: string) => void
}

const navigationItems: NavigationItem[] = [
  { id: 'patients', label: 'Pacientes', icon: 'P' },
  { id: 'appointments', label: 'Citas', icon: 'C' },
]

export function AppLayout({ activeItem, children, onNavigate }: AppLayoutProps) {
  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark">TC</span>
          <div>
            <strong>Terapia Cercana</strong>
            <span>Gesti&oacute;n cl&iacute;nica</span>
          </div>
        </div>

        <nav className="sidebar-nav" aria-label="Navegacion principal">
          <p className="nav-label">Menu principal</p>
          {navigationItems.map((item) => (
            <button
              className={`nav-item ${activeItem === item.id ? 'nav-item-active' : ''}`}
              key={item.id}
              type="button"
              onClick={() => onNavigate(item.id)}
              aria-current={activeItem === item.id ? 'page' : undefined}
            >
              <span className="nav-icon" aria-hidden="true">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">Centro psicologico</div>
      </aside>
      <div className="content-area">{children}</div>
    </div>
  )
}
