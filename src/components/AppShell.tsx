//LAYOUT GENERAL

//Importación de herramientas de rutas
//Link permite navegar sin recargar la pagina, es como si sustituyera al enlace "a" normal de html
//con a, un enlace normal, se envia una peticion al servidor, descarga otro html, borra lo que habia en memoria, vuelve
//a cargar css etc y renderiza la nueva pagina. Osea la pagina se detsruye y se vuelve a crear
//Con Link directamente react intercepta el clic en el enlace/ancla, el navegador no vuelve
//a recargar la pagina sino que cambia la url a lo que sea y React renderiza el componente asociado a esa ruta.
//Los elementos comunes permanecen cargados. Rollo el menu lateral etc... (Basicamente concepto de SPA, renderizamos lo que se ve, no todo)

//NavLink ademas de hacer lo mismo que Link, sabe si la ruta a la que paunta coincide con la actual,
//por ejemplo si le das al icono de e-diary y estas en explore, se queda en la misma pagina, si estas en otra te manda ahí. Detecta
//si esta ya en la pagina que deberia, si lo esta, el enlace esta actio y si no inactivo

//useLocation es un hook que devuelve la ruta actual con location.pathname
import { NavLink, Link, useLocation } from 'react-router-dom';

//ChangeEvent para eventos de inputs y ReactNode, pues son los componentes en si de React
import type { ChangeEvent, ReactNode } from 'react';

//Es un hook creado para actualizar y almacenar el texto introducido en la barrita de busqueda
//El texto se guarda en query y se actualiza con setQuery
import { useSearch } from '../search/SearchContext';

//Importacion de iconos de la carpeta assets
import iconSpaceDashboard from '../assets/icons/MdOutlineSpaceDashboard.svg';
import iconExplore from '../assets/icons/MdOutlineSearch.svg';
import iconStar from '../assets/icons/MdStarBorder.svg';
import iconTune from '../assets/icons/MdTune.svg';
import iconDiario from '../assets/icons/MdOutlineEditCalendar.svg';
import iconMetricas from '../assets/icons/MdInsertChartOutlined.svg';
import iconSearch from '../assets/icons/search.svg';
import logo from '../assets/icons/Ediary_Imagotipo.png';

//Importación de la hoja de estilos
import './AppShell.css';

//Interfaz para las props de este componente
//Tendra "hijos" de tipo ReactNode, osea albergara componentes de React
//Es como si metiera un componente a mano asi:
/**
 * <AppShell>
 *  <Home/> //children
 * </AppShell>
 */
//El titulo es opcional
interface AppShellProps {
  children: ReactNode;
  title?: string;
}

//Estan los enum, los type y las interface, con type puedes definir tipos personalizados
//Por ejemplo type Heroe = 'Superman' | 'Spiderman'
//En este caso funciona tanto con type como con interface
//Esta interface define como debe ser cada elemento del menu, sus props
interface NavItem {
  //Endpoint al que te lleva
  to: string;
  //Etiqueta
  label: string;
  //Icono (imagen)
  icon: string;
  //En caso de ser necesario y detectar como acaba la ruta
  end?: boolean;
  //Si el boton esta activo, se introduce la ruta por parametro
  isActive?: (pathname: string) => boolean;
};

//El menu es un array con todas las opciones: Moodboards, Explorar, Favoritos, Diario, Métricas, Ajustes 
//Para todas las opciones lo mismo
const navItems: NavItem[] = [
  {
    //Endpoint al que te lleva
    to: '/app',
    //Etiqueta
    label: 'Moodboards',
    //Icono
    icon: iconSpaceDashboard,
    //Si estamos en /app o estamos en app/moodboards | app/moodboards/141...
    //Estará activo (NavLink), boton activo o inactivo
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

//clases del css
//Estilo aplicado a los botones del menu
const navLinkClass: string = 'app-shell__nav-link';
const navLinkActiveClass: string = 'app-shell__nav-link is-active';

//Rutas que no van a tener la barra de busquedas en cabecera
const routesWithoutSearch: Set<string> = new Set([
  '/app/diario', '/app/metricas', '/app/ajustes'
]);

//Si el boton esta activo aplica los estilos de navLinkActive.. si no los de la otra clase del css
function navClassName(isActive: boolean): string {
  return isActive ? navLinkActiveClass : navLinkClass;
}

//COMPONENTE PRINCIPAL - obvio lo expotamos para poder utilizarlo en otras partes
//Va a ser de tipo AppShellProps osea que tendra un hijo (un componente de react) y un titulo opcional
export function AppShell({ children, title }: AppShellProps) {
  //Hook que devuelve la ruta actual en la que estas con location.pathname
  const location = useLocation();
  //Hook para el texto de la barra de busqueda, almacenar y modificar
  const { query, setQuery } = useSearch();
  //Si el set contiene no contiene alguna de las rutas especificadas(location.pathname), 
  //el buscador se mostrara (true), si contiene alguna, no se mostrara en esas paginas (false)
  //el metodo has nos sirve para saber si un set contiene algo y devuelve ese booleano
  const showSearch: boolean = !routesWithoutSearch.has(location.pathname);

  //Cada vez que el usuario escribe en la barrita de busqueda pues:
  //a
  //ad
  //adios ...
  //se actualiza el contexto, osea el valor del input de la barra cambia con setQuery
  const handleSearchChange = (event: ChangeEvent<HTMLInputElement>) => {
    setQuery(event.target.value);
  };

  //RENDERIZADO - html
  return (
    <>
      {/**Contenedor principal */}
      <div className="app-shell">
        {/**Barra lateral , funciona igual con un div, pero por cuestiones de nombres y diferenciacion pues eso*/}
        <aside className="app-shell__sidebar" aria-label="Navegación principal">
          {/**Ancla o bueno enlace del loco, al pulsarlo vuelve al inicio (Explorar)*/}
          <Link to="/" className="app-shell__logo" title="E-Diary">
            <img src={logo} alt="E-Diary" />
          </Link>
          {/**Menu de navegacion se crea dinamicamente. Recorremos el array y por cada item, cada elemento genera un NavLink
           * el key es porque React necesita identificar cada elemento de forma unica, para eso sirve el label que le pusimos
           */}
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
                  {/**usamos la funcion isActive del objeto, del item. Pasamos la ruta actual por parametro.
                    Si estamos en ella sera true y si no false, aunque moodboards tiene sus propios criterios
                    Llamamos a la funcion que usa un estilo u otro dependiendo de si la ruta esta activa
                    mostrara la barra en funcion de que el parametro sea true o false */}
                  return navClassName(isNavActive);
                }}
                title={item.label}
              >
                {/**Icono del menu */}
                <img src={item.icon} alt="" draggable={false} />
                {/**Texto oculto para saber donde estamos o que es esa opcion del menu */}
                <span className="visually-hidden">{item.label}</span>
              </NavLink>
            ))}
          </nav>
        </aside>

        {/**Cuerpo principal */}
        <div className="app-shell__body">
          {/**El buscador aparece solo si es true */}
          {showSearch && (
            <header className="app-shell__topbar">
              <div className="app-shell__search">
                <img src={iconSearch} alt="" />
                <input
                  type="search"
                  placeholder="Busca"
                  aria-label="Buscar"
                  /**input controlado */
                  value={query}
                  onChange={handleSearchChange}
                />
              </div>
            </header>
          )}
          {/**Se renderiza si existe la prop title, es el encabezado h1 de la pagina */}
          {title && <h1 className="app-shell__title">{title}</h1>}
          {/**Area principal */}
          <main className="app-shell__main">
            {/**Area del contenido en sí, pasamos el hijo/ componente que sea */}
            <div className="app-shell__content">{children}</div>
          </main>
        </div>
      </div>
    </>
  );
}
