import clsx from "clsx";
import { Bell, Gavel, LayoutGrid, LogOut, Menu, MessageCircle, Moon, PackagePlus, Sun, Trophy, X } from "lucide-react";
import { useCallback, useEffect, useState, type ComponentType } from "react";
import { NavLink, Outlet, useLocation, useNavigate, useOutletContext } from "react-router-dom";
import { toast } from "sonner";

import { Logo, useSelectionIndicator } from "../components/ui";
import { api } from "../lib/api";
import { useTema } from "../lib/tema";
import { useEnVivo, useEventos } from "./enVivo";
import { useSesion } from "./sesion";

interface ItemMenu {
  a: string;
  texto: string;
  icono: ComponentType<{ className?: string }>;
}

const MENU_CLIENTE: ItemMenu[] = [
  { a: "/app/subastas", texto: "Subastas", icono: LayoutGrid },
  { a: "/app/mis-pujas", texto: "Mis pujas", icono: Trophy },
  { a: "/app/mensajes", texto: "Mensajes", icono: MessageCircle },
];

const MENU_EMPRESA: ItemMenu[] = [
  { a: "/app/mis-subastas", texto: "Mis subastas", icono: Gavel },
  { a: "/app/nueva", texto: "Nueva subasta", icono: PackagePlus },
  { a: "/app/subastas", texto: "Explorar", icono: LayoutGrid },
  { a: "/app/mensajes", texto: "Mensajes", icono: MessageCircle },
];

export interface ContextoPanel {
  refrescarContadores: () => void;
}

export function usePanel() {
  return useOutletContext<ContextoPanel>();
}

function iniciales(nombre: string) {
  return nombre.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase()).join("");
}

function Contador({ valor }: { valor: number }) {
  if (valor <= 0) return null;
  return (
    <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center leading-none pointer-events-none">
      {valor > 9 ? "9+" : valor}
    </span>
  );
}

export function Panel() {
  const { usuario, salir } = useSesion();
  const { oscuro, alternar } = useTema();
  const { conectado } = useEnVivo();
  const navegar = useNavigate();
  const ubicacion = useLocation();
  const menu = usuario?.rol === "subastador" ? MENU_EMPRESA : MENU_CLIENTE;
  const activeMenuKey = menu.find(({ a }) => ubicacion.pathname === a || ubicacion.pathname.startsWith(`${a}/`))?.a ?? ubicacion.pathname;
  const indicador = useSelectionIndicator(activeMenuKey);
  const [menuMovil, setMenuMovil] = useState(false);
  const [notificaciones, setNotificaciones] = useState(0);
  const [mensajes, setMensajes] = useState(0);

  const refrescarContadores = useCallback(() => {
    api.notificaciones().then((n) => setNotificaciones(n.filter((x) => !x.leida).length)).catch(() => {});
    api.conversaciones().then((c) => setMensajes(c.reduce((t, x) => t + x.no_leidos, 0))).catch(() => {});
  }, []);

  useEffect(refrescarContadores, [refrescarContadores]);
  useEffect(() => setMenuMovil(false), [ubicacion.pathname]);

  useEventos((evento) => {
    if (evento.tipo === "notificacion") {
      setNotificaciones((n) => n + 1);
      const { titulo, mensaje, subasta_id, tipo } = evento.notificacion;
      const opciones = {
        description: mensaje,
        action: subasta_id ? { label: "Ver", onClick: () => navegar(`/app/subastas/${subasta_id}`) } : undefined,
      };
      if (tipo === "ganaste") toast.success(titulo, opciones);
      else if (tipo === "superado") toast.warning(titulo, opciones);
      else toast(titulo, opciones);
    }
    if (evento.tipo === "mensaje_privado" && evento.mensaje.remitente_id !== usuario?.id) {
      // Si la persona tiene esa conversación abierta, la pantalla de mensajes
      // la marca como leída y vuelve a pedir los contadores.
      if (!ubicacion.pathname.endsWith(evento.mensaje.conversacion_id ?? "-")) setMensajes((n) => n + 1);
    }
  });

  if (!usuario) return null;
  const subtitulo = usuario.rol === "subastador" ? usuario.empresa_nombre : "Cliente";

  const navegacion = (
    <nav ref={indicador.containerRef} className="relative flex flex-col gap-0.5 p-2 mt-1 flex-1">
      <span
        aria-hidden="true"
        className="absolute pointer-events-none rounded-lg transition-[left,top,width,height,opacity] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none bg-primary/10 dark:bg-accent/15"
        style={indicador.style}
      />
      {menu.map(({ a, texto, icono: Icono }) => (
        <NavLink
          key={a}
          ref={indicador.registerItem(a)}
          to={a}
          end={a === "/app/subastas"}
          className={() => clsx(
            "relative z-10 flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium transition-all duration-200 ease-in-out",
            activeMenuKey === a ? "text-primary dark:text-accent" : "text-muted-foreground hover:text-foreground hover:bg-muted hover:translate-x-0.5",
          )}
        >
          <Icono className="w-4 h-4 flex-shrink-0" />
          <span>{texto}</span>
          {a === "/app/mensajes" && mensajes > 0 && (
            <span className="ml-auto min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">{mensajes > 9 ? "9+" : mensajes}</span>
          )}
        </NavLink>
      ))}
    </nav>
  );

  const pie = (
    <div className="p-2 border-t border-border">
      <button onClick={() => { salir(); navegar("/"); }} className="flex items-center gap-2.5 w-full rounded-lg px-2.5 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted">
        <LogOut className="w-4 h-4" />Cerrar sesión
      </button>
    </div>
  );

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Menú lateral fijo en escritorio */}
      <aside className="hidden md:flex w-56 flex-shrink-0 flex-col bg-card border-r border-border">
        <div className="flex items-center h-[57px] px-4 border-b border-border">
          <NavLink to="/app"><Logo /></NavLink>
        </div>
        {navegacion}
        {pie}
      </aside>

      {/* Menú lateral como cajón en móvil */}
      {menuMovil && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMenuMovil(false)} />
          <aside className="relative w-64 max-w-[80%] flex flex-col bg-card border-r border-border">
            <div className="flex items-center justify-between h-[57px] px-4 border-b border-border">
              <Logo />
              <button onClick={() => setMenuMovil(false)} aria-label="Cerrar menú" className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-muted"><X className="w-4 h-4" /></button>
            </div>
            {navegacion}
            {pie}
          </aside>
        </div>
      )}

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-[57px] flex items-center justify-between gap-2 px-3 sm:px-5 bg-card border-b border-border flex-shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <button onClick={() => setMenuMovil(true)} aria-label="Abrir menú" className="md:hidden w-9 h-9 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-muted"><Menu className="w-5 h-5" /></button>
            <span className="md:hidden"><Logo /></span>
            <span className={clsx("hidden sm:inline-flex items-center gap-1.5 text-xs", conectado ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground")} title={conectado ? "Recibiendo pujas en vivo" : "Reconectando…"}>
              <span className={clsx("w-2 h-2 rounded-full", conectado ? "bg-emerald-500" : "bg-muted-foreground/50")} />
              {conectado ? "En vivo" : "Reconectando…"}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={() => navegar("/app/notificaciones")} aria-label="Notificaciones" className="relative w-8 h-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted">
              <Bell className="w-4 h-4" /><Contador valor={notificaciones} />
            </button>
            <button onClick={() => navegar("/app/mensajes")} aria-label="Mensajes" className="relative w-8 h-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted">
              <MessageCircle className="w-4 h-4" /><Contador valor={mensajes} />
            </button>
            <button
              onClick={(e) => alternar(e)}
              aria-label={oscuro ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-muted-foreground hover:bg-primary hover:text-primary-foreground dark:hover:bg-accent dark:hover:text-accent-foreground transition-colors"
            >
              {oscuro ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            <div className="w-px h-5 bg-border mx-2 hidden sm:block" />
            <div className="flex items-center gap-2.5">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium leading-tight">{usuario.nombre}</p>
                <p className="text-xs text-muted-foreground leading-tight">{subtitulo}</p>
              </div>
              <div className="w-9 h-9 rounded-full bg-primary text-primary-foreground dark:bg-accent dark:text-accent-foreground flex items-center justify-center text-sm font-semibold">{iniciales(usuario.nombre)}</div>
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto">
          <Outlet context={{ refrescarContadores } satisfies ContextoPanel} />
        </main>
      </div>
    </div>
  );
}
