export type Rol = "cliente" | "subastador" | "admin";
export type Modalidad = "tiempo" | "en_vivo";
export type EstadoSubasta = "proxima" | "activa" | "finalizada" | "cancelada";
export type Resultado = "adjudicada" | "desierta" | null;
export type Situacion = "ganando" | "superado" | "ganada" | "perdida";

export interface Usuario {
  id: string;
  email: string;
  nombre: string;
  rol: Rol;
  empresa_nombre: string | null;
  nit: string | null;
  telefono: string | null;
  ciudad: string | null;
}

export interface Sesion {
  token: string;
  usuario: Usuario;
}

export interface SubastaResumen {
  id: string;
  titulo: string;
  categoria: string;
  cantidad: string | null;
  ubicacion: string | null;
  moneda: string;
  precio_inicial: number;
  precio_actual: number | null;
  minimo_siguiente: number;
  total_pujas: number;
  modalidad: Modalidad;
  estado: EstadoSubasta;
  resultado: Resultado;
  fecha_inicio: string;
  fecha_fin: string | null;
  imagen_principal: string | null;
  subastador: { id: string; empresa_nombre: string | null; ciudad: string | null };
}

export interface SubastaDetalle extends SubastaResumen {
  descripcion: string;
  incremento_minimo: number;
  tiene_reserva: boolean;
  reserva_alcanzada: boolean;
  precio_reserva: number | null;
  duracion_minutos: number | null;
  imagenes: { id: string; url: string }[];
  ganador: { alias: string; nombre: string | null; email: string | null; telefono: string | null } | null;
  es_mia: boolean;
  mi_situacion: Situacion | null;
  mi_puja_maxima: number | null;
}

export interface Puja {
  id: string;
  monto: number;
  fecha: string;
  alias: string;
  es_mia: boolean;
  nombre: string | null;
}

export interface MiPuja {
  subasta: SubastaResumen;
  mi_puja_maxima: number;
  situacion: Situacion | EstadoSubasta;
}

export interface Mensaje {
  id: string;
  subasta_id: string;
  conversacion_id: string | null;
  remitente_id: string | null;
  remitente: string;
  es_subastador: boolean;
  es_sistema: boolean;
  contenido: string;
  fecha: string;
}

export interface Conversacion {
  id: string;
  subasta_id: string;
  subasta_titulo: string;
  subasta_imagen: string | null;
  contraparte: string;
  ultimo_mensaje: string | null;
  fecha_ultimo_mensaje: string | null;
  no_leidos: number;
}

export interface Notificacion {
  id: string;
  tipo: string;
  titulo: string;
  mensaje: string;
  subasta_id: string | null;
  leida: boolean;
  fecha: string;
}

export interface Estadisticas {
  subastas_activas: number;
  en_vivo_ahora: number;
  proximas: number;
  lotes_adjudicados: number;
  empresas: number;
}

// Eventos que llegan por el WebSocket.
export type EventoEnVivo =
  | { tipo: "conectado"; autenticado: boolean }
  | { tipo: "pong" }
  | {
      tipo: "puja";
      canal: string;
      subasta_id: string;
      puja: { id: string; monto: number; fecha: string; alias: string };
      precio_actual: number;
      minimo_siguiente: number;
      total_pujas: number;
      fecha_fin: string | null;
      extendida: boolean;
    }
  | { tipo: "estado"; canal: string; subasta_id: string; subasta: SubastaResumen; ganador_alias: string | null }
  | { tipo: "mensaje_sala"; canal: string; mensaje: Mensaje }
  | { tipo: "mensaje_privado"; canal: string; mensaje: Mensaje }
  | { tipo: "notificacion"; canal: string; notificacion: Notificacion };
