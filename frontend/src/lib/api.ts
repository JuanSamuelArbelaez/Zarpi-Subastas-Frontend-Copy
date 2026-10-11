import type {
  Conversacion, Estadisticas, Mensaje, MiPuja, Notificacion, Puja, Sesion,
  SubastaDetalle, SubastaResumen, Usuario,
} from "./types";

const BASE = (import.meta.env.VITE_API_URL as string | undefined) ?? "/api";
const CLAVE_TOKEN = "zarpi-subastas-token";

export function leerToken(): string | null {
  try { return localStorage.getItem(CLAVE_TOKEN); } catch { return null; }
}

export function guardarToken(token: string | null) {
  try {
    if (token) localStorage.setItem(CLAVE_TOKEN, token);
    else localStorage.removeItem(CLAVE_TOKEN);
  } catch { /* sin almacenamiento: la sesión dura lo que la pestaña */ }
}

export class ErrorApi extends Error {
  constructor(public estado: number, mensaje: string) {
    super(mensaje);
  }
}

function mensajeDeError(cuerpo: unknown, estado: number): string {
  const detalle = (cuerpo as { detail?: unknown } | null)?.detail;
  if (typeof detalle === "string") return detalle;
  // Errores de validación de FastAPI: lista con el mensaje de cada campo.
  if (Array.isArray(detalle) && detalle.length > 0) {
    const primero = detalle[0] as { msg?: string };
    return (primero.msg ?? "Revisa los datos").replace(/^Value error, /, "");
  }
  if (estado >= 500) return "El servidor tuvo un problema. Intenta de nuevo.";
  return "No se pudo completar la acción";
}

async function pedir<T>(ruta: string, opciones: RequestInit = {}): Promise<T> {
  const token = leerToken();
  const headers = new Headers(opciones.headers);
  if (token) headers.set("Authorization", `Bearer ${token}`);
  if (opciones.body && !(opciones.body instanceof FormData)) headers.set("Content-Type", "application/json");

  let respuesta: Response;
  try {
    respuesta = await fetch(`${BASE}${ruta}`, { ...opciones, headers });
  } catch {
    throw new ErrorApi(0, "No hay conexión con el servidor");
  }
  if (respuesta.status === 204) return undefined as T;
  const cuerpo = await respuesta.json().catch(() => null);
  if (!respuesta.ok) throw new ErrorApi(respuesta.status, mensajeDeError(cuerpo, respuesta.status));
  return cuerpo as T;
}

const json = (datos: unknown) => JSON.stringify(datos);

export interface FiltrosSubastas {
  estado?: "activa" | "proxima" | "finalizada" | "vigentes";
  modalidad?: "tiempo" | "en_vivo";
  categoria?: string;
  q?: string;
  orden?: "cierre" | "recientes" | "precio_asc" | "precio_desc";
  limite?: number;
}

export interface NuevaSubasta {
  titulo: string;
  descripcion: string;
  categoria: string;
  cantidad?: string;
  ubicacion?: string;
  precio_inicial: number;
  incremento_minimo: number;
  precio_reserva?: number | null;
  modalidad: "tiempo" | "en_vivo";
  fecha_inicio?: string | null;
  duracion_minutos?: number | null;
  imagen_ids: string[];
}

export interface DatosRegistro {
  email: string;
  password: string;
  nombre: string;
  rol: "cliente" | "subastador";
  empresa_nombre?: string;
  nit?: string;
  telefono?: string;
  ciudad?: string;
}

export const api = {
  registrar: (datos: DatosRegistro) => pedir<Sesion>("/auth/registro", { method: "POST", body: json(datos) }),
  login: (email: string, password: string) => pedir<Sesion>("/auth/login", { method: "POST", body: json({ email, password }) }),
  yo: () => pedir<Usuario>("/auth/me"),
  ticketWs: () => pedir<{ ticket: string }>("/auth/ws-ticket", { method: "POST" }),

  categorias: () => pedir<string[]>("/categorias"),
  estadisticas: () => pedir<Estadisticas>("/estadisticas"),
  subastas: (filtros: FiltrosSubastas = {}) => {
    const params = new URLSearchParams();
    Object.entries(filtros).forEach(([k, v]) => { if (v !== undefined && v !== "") params.set(k, String(v)); });
    const qs = params.toString();
    return pedir<SubastaResumen[]>(`/subastas${qs ? `?${qs}` : ""}`);
  },
  subasta: (id: string) => pedir<SubastaDetalle>(`/subastas/${id}`),
  misSubastas: () => pedir<SubastaResumen[]>("/subastas/mias"),
  crearSubasta: (datos: NuevaSubasta) => pedir<SubastaDetalle>("/subastas", { method: "POST", body: json(datos) }),
  iniciar: (id: string) => pedir<SubastaDetalle>(`/subastas/${id}/iniciar`, { method: "POST" }),
  cerrar: (id: string) => pedir<SubastaDetalle>(`/subastas/${id}/cerrar`, { method: "POST" }),
  cancelar: (id: string) => pedir<SubastaDetalle>(`/subastas/${id}/cancelar`, { method: "POST" }),
  subirImagenes: (archivos: File[]) => {
    const datos = new FormData();
    archivos.forEach((a) => datos.append("archivos", a));
    return pedir<{ id: string; url: string }[]>("/imagenes", { method: "POST", body: datos });
  },

  pujas: (id: string) => pedir<Puja[]>(`/subastas/${id}/pujas`),
  pujar: (id: string, monto: number) => pedir<Puja>(`/subastas/${id}/pujas`, { method: "POST", body: json({ monto }) }),
  misPujas: () => pedir<MiPuja[]>("/pujas/mias"),

  sala: (id: string) => pedir<Mensaje[]>(`/subastas/${id}/sala`),
  escribirEnSala: (id: string, contenido: string) =>
    pedir<Mensaje>(`/subastas/${id}/sala`, { method: "POST", body: json({ contenido }) }),
  abrirConversacion: (subastaId: string) =>
    pedir<Conversacion>(`/subastas/${subastaId}/conversacion`, { method: "POST" }),
  conversaciones: () => pedir<Conversacion[]>("/conversaciones"),
  mensajes: (conversacionId: string) => pedir<Mensaje[]>(`/conversaciones/${conversacionId}/mensajes`),
  escribirPrivado: (conversacionId: string, contenido: string) =>
    pedir<Mensaje>(`/conversaciones/${conversacionId}/mensajes`, { method: "POST", body: json({ contenido }) }),

  notificaciones: () => pedir<Notificacion[]>("/notificaciones"),
  leerNotificacion: (id: string) => pedir<Notificacion>(`/notificaciones/${id}/leer`, { method: "POST" }),
  leerTodas: () => pedir<void>("/notificaciones/leer-todas", { method: "POST" }),
};

/** Las imágenes vienen como /media/...; en desarrollo y producción pasan por el mismo origen. */
export function urlMedia(ruta: string | null | undefined): string | undefined {
  if (!ruta) return undefined;
  if (/^https?:\/\//.test(ruta)) return ruta;
  const origen = (import.meta.env.VITE_MEDIA_URL as string | undefined) ?? "";
  return `${origen}${ruta}`;
}
