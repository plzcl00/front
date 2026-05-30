import { NavLink, Link, useLocation } from 'react-router-dom';
import type { ChangeEvent, ReactNode } from 'react';
import { useSearch } from '../search/SearchContext';
import iconGrid from '../assets/icons/layout-grid.svg';
import iconEye from '../assets/icons/eye.svg';
import iconHeart from '../assets/icons/heart.svg';
import iconSettings from '../assets/icons/settings.svg';
import iconCalendar from '../assets/icons/calendar.svg';
import iconGraphics from '../assets/icons/graphics.svg';
import iconSearch from '../assets/icons/search.svg';
import logo from '../assets/Ediary.png';
import './AppShell.css';

interface AppShellProps {
  children: ReactNode;
  title?: string;
}

type NavItem = {
  to: string;
  label: string;
  icon: string;
  end?: boolean;
  isActive?: (pathname: string) => boolean;
};

const navItems: NavItem[] = [
  {
    to: '/app',
    label: 'Moodboards',
    icon: iconGrid,
    isActive: (pathname) =>
      pathname === '/app' ||
      pathname.startsWith('/app/moodboards'),
  },
  {
    to: '/app/explorar',
    label: 'Explorar',
    icon: iconEye,
  },
  {
    to: '/app/favoritos',
    label: 'Favoritos',
    icon: iconHeart,
  },
  {
    to: '/app/diario',
    label: 'Diario',
    icon: iconCalendar,
  },
  {
    to: '/app/metricas',
    label: 'Métricas',
    icon: iconGraphics,
  },
  {
    to: '/app/ajustes',
    label: 'Ajustes',
    icon: iconSettings,
  },
];

const navLinkClass = 'app-shell__nav-link';
const navLinkActiveClass = 'app-shell__nav-link is-active';

function navClassName(isActive: boolean): string {
  return isActive ? navLinkActiveClass : navLinkClass;
}

export function AppShell({ children, title }: AppShellProps) {
  const location = useLocation();
  const { query, setQuery } = useSearch();

  const handleSearchChange = (event: ChangeEvent<HTMLInputElement>) => {
    setQuery(event.target.value);
  };

  return (
    <div className="app-shell">
      <aside className="app-shell__sidebar" aria-label="Navegación principal">
        <Link to="/" className="app-shell__logo" title="E-Diary">
          <img src={logo} alt="E-Diary" />
        </Link>
        <nav className="app-shell__nav">
          {navItems.map((item) => (
              <NavLink
                key={item.label}
                to={item.to}
                end={item.end}
                className={({ isActive: routerActive }) => {
                  const isNavActive = item.isActive
                    ? item.isActive(location.pathname)
                    : routerActive;
                  return navClassName(isNavActive);
                }}
                title={item.label}
              >
                <img src={item.icon} alt="" draggable={false} />
                <span className="visually-hidden">{item.label}</span>
              </NavLink>
          ))}
        </nav>
      </aside>

      <div className="app-shell__body">
        <header className="app-shell__topbar">
          <div className="app-shell__search">
            <img src={iconSearch} alt="" />
            <input
              type="search"
              placeholder="Busca"
              aria-label="Buscar"
              value={query}
              onChange={handleSearchChange}
            />
          </div>
          {title && <h1 className="app-shell__title">{title}</h1>}
        </header>
        <main className="app-shell__main">
          <div className="app-shell__content">{children}</div>
        </main>
      </div>
    </div>
  );
}
