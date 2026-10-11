import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";

import { api } from "../lib/api";
import type { EventoEnVivo } from "../lib/types";
import { useSesion } from "./sesion";

type Oyente = (evento: EventoEnVivo) => void;

interface ContextoEnVivo {
  conectado: boolean;
  /** Escucha todos los eventos que llegan. Devuelve la función para dejar de escuchar. */
  escuchar: (oyente: Oyente) => () => void;
  /** Pide los eventos de una subasta mientras el componente esté montado. */
  seguirSubasta: (subastaId: string) => () => void;
}

const Contexto = createContext<ContextoEnVivo | null>(null);

function urlWs(ticket?: string) {
  const base = (import.meta.env.VITE_WS_URL as string | undefined)
    ?? `${location.protocol === "https:" ? "wss" : "ws"}://${location.host}/ws`;
  return ticket ? `${base}?ticket=${encodeURIComponent(ticket)}` : base;
}

/**
 * Una sola conexión WebSocket para toda la app. Se reconecta sola y, al volver,
 * se vuelve a suscribir a las subastas que la pantalla estaba siguiendo.
 */
export function ProveedorEnVivo({ children }: { children: ReactNode }) {
  const { usuario } = useSesion();
  const [conectado, setConectado] = useState(false);
  const ws = useRef<WebSocket | null>(null);
  const oyentes = useRef(new Set<Oyente>());
  const subastas = useRef(new Map<string, number>());

  const enviar = useCallback((datos: unknown) => {
    if (ws.current?.readyState === WebSocket.OPEN) ws.current.send(JSON.stringify(datos));
  }, []);

  useEffect(() => {
    let cancelado = false;
    let reintento: ReturnType<typeof setTimeout> | undefined;
    let latido: ReturnType<typeof setInterval> | undefined;
    let espera = 1000;

    async function conectar() {
      let ticket: string | undefined;
      if (usuario) {
        try { ticket = (await api.ticketWs()).ticket; } catch { /* sigue como espectador */ }
      }
      if (cancelado) return;
      const socket = new WebSocket(urlWs(ticket));
      ws.current = socket;

      socket.onopen = () => {
        espera = 1000;
        setConectado(true);
        subastas.current.forEach((_, id) => socket.send(JSON.stringify({ accion: "suscribir", canal: `subasta:${id}` })));
        latido = setInterval(() => socket.readyState === WebSocket.OPEN && socket.send('{"accion":"ping"}'), 25000);
      };
      socket.onmessage = (e) => {
        let evento: EventoEnVivo;
        try { evento = JSON.parse(e.data); } catch { return; }
        oyentes.current.forEach((o) => o(evento));
      };
      socket.onclose = () => {
        setConectado(false);
        clearInterval(latido);
        if (!cancelado) {
          reintento = setTimeout(conectar, espera);
          espera = Math.min(espera * 2, 15000);
        }
      };
    }

    conectar();
    return () => {
      cancelado = true;
      clearTimeout(reintento);
      clearInterval(latido);
      ws.current?.close();
      ws.current = null;
    };
  }, [usuario?.id]);

  const escuchar = useCallback((oyente: Oyente) => {
    oyentes.current.add(oyente);
    return () => { oyentes.current.delete(oyente); };
  }, []);

  const seguirSubasta = useCallback((id: string) => {
    const veces = subastas.current.get(id) ?? 0;
    subastas.current.set(id, veces + 1);
    if (veces === 0) enviar({ accion: "suscribir", canal: `subasta:${id}` });
    return () => {
      const restantes = (subastas.current.get(id) ?? 1) - 1;
      if (restantes <= 0) {
        subastas.current.delete(id);
        enviar({ accion: "desuscribir", canal: `subasta:${id}` });
      } else {
        subastas.current.set(id, restantes);
      }
    };
  }, [enviar]);

  return <Contexto.Provider value={{ conectado, escuchar, seguirSubasta }}>{children}</Contexto.Provider>;
}

export function useEnVivo() {
  const contexto = useContext(Contexto);
  if (!contexto) throw new Error("useEnVivo fuera de ProveedorEnVivo");
  return contexto;
}

/** Atajo: ejecuta `alRecibir` con cada evento mientras el componente vive. */
export function useEventos(alRecibir: (evento: EventoEnVivo) => void) {
  const { escuchar } = useEnVivo();
  const ref = useRef(alRecibir);
  ref.current = alRecibir;
  useEffect(() => escuchar((e) => ref.current(e)), [escuchar]);
}
