import { useEffect, useState, type ReactNode } from "react";
import { Drawer } from "@mantine/core";
import { useMediaQuery, useReducedMotion } from "@mantine/hooks";
import { IconMenu2 } from "@tabler/icons-react";
import { useAuth } from "../hooks/useAuth";
import { useRoles } from "../hooks/useRoles";
import type { MenuItemId } from "../config/permissions";

type AppLayoutProps = {
  activeItem: string;
  children: ReactNode;
  onNavigate: (itemId: MenuItemId) => void;
};

export function AppLayout({
  activeItem,
  children,
  onNavigate,
}: AppLayoutProps) {
  const { user, logout } = useAuth();
  const { menuItems } = useRoles();
  const [menuOpened, setMenuOpened] = useState(false);
  const reducedMotion = useReducedMotion();
  const isCompact = useMediaQuery("(max-width: 63.99em)", undefined, {
    getInitialValueInEffect: false,
  });
  const activeLabel =
    menuItems.find((item) => item.id === activeItem)?.label ?? "Inicio";

  useEffect(() => {
    const compactQuery = window.matchMedia("(max-width: 63.99em)");
    const closeOnDesktop = (event: MediaQueryListEvent) => {
      if (!event.matches) setMenuOpened(false);
    };
    compactQuery.addEventListener("change", closeOnDesktop);
    return () => compactQuery.removeEventListener("change", closeOnDesktop);
  }, []);

  const navigation = (
    <>
      <div className="brand">
        <span className="brand-mark" aria-hidden="true">
          TC
        </span>
        <div>
          <strong>Terapia Cercana</strong>
          <span>Gestión clínica</span>
        </div>
      </div>

      <nav className="sidebar-nav" aria-label="Navegación principal">
        <p className="nav-label">Menú principal</p>
        {menuItems.map((item) => (
          <button
            className={`nav-item ${activeItem === item.id ? "nav-item-active" : ""}`}
            key={item.id}
            type="button"
            onClick={() => {
              onNavigate(item.id);
              setMenuOpened(false);
            }}
            aria-current={activeItem === item.id ? "page" : undefined}
          >
            <span className="nav-icon" aria-hidden="true">
              {item.icon}
            </span>
            {item.label}
          </button>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="user-info">
          <p className="user-name">
            {user?.firstName} {user?.lastName}
          </p>
          <p className="user-email">{user?.email}</p>
        </div>
        <button className="logout-button" onClick={logout} type="button">
          Cerrar sesión
        </button>
      </div>
    </>
  );

  return (
    <div className="app-layout">
      <a className="skip-link" href="#main-content">
        Saltar al contenido
      </a>
      {!isCompact && <aside className="sidebar">{navigation}</aside>}
      {isCompact && (
        <>
          <header className="mobile-header">
            <button
              className="menu-toggle"
              type="button"
              onClick={() => setMenuOpened(true)}
              aria-label="Abrir menú principal"
              aria-expanded={menuOpened}
              aria-controls={menuOpened ? "mobile-navigation-body" : undefined}
              aria-haspopup="dialog"
            >
              <IconMenu2 size={24} aria-hidden="true" />
            </button>
            <div className="mobile-header-title">
              <strong>Terapia Cercana</strong>
              <span>{activeLabel}</span>
            </div>
          </header>
          <Drawer
            id="mobile-navigation"
            opened={menuOpened}
            onClose={() => setMenuOpened(false)}
            position="left"
            size="min(320px, 90vw)"
            title="Menú principal"
            padding={0}
            classNames={{
              content: "navigation-drawer-content",
              header: "navigation-drawer-header",
              body: "navigation-drawer-body",
              close: "navigation-drawer-close",
            }}
            closeButtonProps={{ "aria-label": "Cerrar menú principal" }}
            transitionProps={{ duration: reducedMotion ? 0 : 150 }}
          >
            <div className="mobile-navigation">{navigation}</div>
          </Drawer>
        </>
      )}
      <main id="main-content" className="content-area" tabIndex={-1}>
        {children}
      </main>
    </div>
  );
}
