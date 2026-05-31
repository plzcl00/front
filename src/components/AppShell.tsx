import { NavLink, Link, useLocation } from 'react-router-dom';
import type { ChangeEvent, ReactNode } from 'react';
import { useSearch } from '../search/SearchContext';
import iconSpaceDashboard from '../assets/icons/MdOutlineSpaceDashboard.svg';
import iconExplore from '../assets/icons/MdOutlineSearch.svg';
import iconStar from '../assets/icons/MdStarBorder.svg';
import iconTune from '../assets/icons/MdTune.svg';
import iconDiario from '../assets/icons/MdOutlineEditCalendar.svg';
import iconMetricas from '../assets/icons/MdInsertChartOutlined.svg';
import iconSearch from '../assets/icons/search.svg';
import logo from '../assets/icons/Ediary_Imagotipo.png';
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
    icon: iconSpaceDashboard,
    isActive: (pathname) =>
      pathname === '/app' ||
      pathname.startsWith('/app/moodboards'),
  },
  {
    to: '/app/explorar',
    label: 'Explorar',
    icon: iconExplore,
  },
  {
    to: '/app/favoritos',
    label: 'Favoritos',
    icon: iconStar,
  },
  {
    to: '/app/diario',
    label: 'Diario',
    icon: iconDiario,
  },
  {
    to: '/app/metricas',
    label: 'Métricas',
    icon: iconMetricas,
  },
  {
    to: '/app/ajustes',
    label: 'Ajustes',
    icon: iconTune,
  },
];

const navLinkClass = 'app-shell__nav-link';
const navLinkActiveClass = 'app-shell__nav-link is-active';

const routesWithoutSearch = new Set(['/app/diario', '/app/metricas', '/app/ajustes']);

function navClassName(isActive: boolean): string {
  return isActive ? navLinkActiveClass : navLinkClass;
}

export function AppShell({ children, title }: AppShellProps) {
  const location = useLocation();
  const { query, setQuery } = useSearch();
  const showSearch = !routesWithoutSearch.has(location.pathname);

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
        {showSearch && (
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
          </header>
        )}
        {title && <h1 className="app-shell__title">{title}</h1>}
        <main className="app-shell__main">
          <div className="app-shell__content">{children}</div>
        </main>
      </div>
    </div>
  );
}
