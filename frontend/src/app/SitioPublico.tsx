import { Moon, Sun } from "lucide-react";
import type { ReactNode } from "react";
import { Link, Navigate, NavLink, Outlet, useLocation } from "react-router-dom";

import { Button, Cargando, Logo } from "../components/ui";
import { useTema } from "../lib/tema";
import { useSesion } from "./sesion";

/**
 * Catálogo abierto a visitantes. Quien ya tiene sesión pasa a la misma
 * pantalla dentro del panel, donde puede pujar y chatear.
 */
export function SoloVisitantes({ children }: { children: ReactNode }) {
  const { usuario, cargando } = useSesion();
  const { pathname, search } = useLocation();
  if (cargando) return <Cargando />;
  if (usuario) return <Navigate to={`/app${pathname}${search}`} replace />;
  return <>{children}</>;
}

export function SitioPublico() {
  const { oscuro, alternar } = useTema();
  const { pathname } = useLocation();
  const siguiente = encodeURIComponent(`/app${pathname}`);

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground overflow-x-hidden">
      <header className="sticky top-0 z-40 bg-background/85 backdrop-blur-md border-b border-border">
        <div className="max-w-7xl mx-auto h-16 px-4 sm:px-6 flex items-center justify-between gap-3">
          <div className="flex items-center gap-4 min-w-0">
            <Link to="/" aria-label="Ir al inicio" className="flex-shrink-0"><Logo /></Link>
            <NavLink
              to="/subastas"
              end
              className={({ isActive }) => `hidden sm:inline-flex px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${isActive ? "bg-primary text-white dark:bg-accent dark:text-accent-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}
            >
              Subastas
            </NavLink>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={(e) => alternar(e)}
              aria-label={oscuro ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-primary hover:text-primary-foreground dark:hover:bg-accent dark:hover:text-accent-foreground"
            >
              {oscuro ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            <Link to={`/entrar?siguiente=${siguiente}`}>
              <Button variant="secondary" size="sm" className="whitespace-nowrap"><span className="sm:hidden">Entrar</span><span className="hidden sm:inline">Iniciar sesión</span></Button>
            </Link>
            <Link to={`/registro?siguiente=${siguiente}`} className="hidden sm:inline-flex">
              <Button variant="primary" size="sm" className="dark:bg-accent dark:text-accent-foreground dark:hover:bg-accent/80">Registrarse</Button>
            </Link>
          </div>
        </div>
      </header>
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
}
