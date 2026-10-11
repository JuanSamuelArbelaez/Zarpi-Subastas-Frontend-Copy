import clsx from "clsx";
import { Gavel, ImageOff, MapPin, Radio, Timer } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { urlMedia } from "../lib/api";
import { dineroCorto, fechaHora, tiempoRestante } from "../lib/formato";
import type { SubastaResumen } from "../lib/types";
import { Pildora } from "./ui";

/** Hora actual que se refresca sola (para cuentas regresivas). */
export function useAhora(intervaloMs = 1000) {
  const [ahora, setAhora] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setAhora(Date.now()), intervaloMs);
    return () => clearInterval(id);
  }, [intervaloMs]);
  return ahora;
}

export function EtiquetaEstado({ subasta }: { subasta: Pick<SubastaResumen, "estado" | "modalidad" | "resultado"> }) {
  const { estado, modalidad, resultado } = subasta;
  if (estado === "activa" && modalidad === "en_vivo") {
    return (
      <Pildora className="bg-destructive text-white">
        <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />En vivo
      </Pildora>
    );
  }
  if (estado === "activa") return <Pildora className="bg-accent text-accent-foreground"><span className="w-1.5 h-1.5 rounded-full bg-current" />Activa</Pildora>;
  if (estado === "proxima") return <Pildora className="bg-primary text-primary-foreground">Próximamente</Pildora>;
  if (estado === "cancelada") return <Pildora className="bg-foreground text-background">Cancelada</Pildora>;
  return resultado === "adjudicada"
    ? <Pildora className="bg-emerald-600 text-white">Adjudicada</Pildora>
    : <Pildora className="bg-foreground text-background">Desierta</Pildora>;
}

export function EtiquetaModalidad({ modalidad, sobreImagen = false }: { modalidad: SubastaResumen["modalidad"]; sobreImagen?: boolean }) {
  // Sobre una foto el fondo translúcido no se lee: ahí va blanco sólido.
  const clase = sobreImagen ? "bg-white/95 text-black shadow-sm" : "bg-foreground/5 text-foreground";
  return modalidad === "en_vivo"
    ? <Pildora className={clase}><Radio className="w-3 h-3" />En vivo</Pildora>
    : <Pildora className={clase}><Timer className="w-3 h-3" />Por tiempo</Pildora>;
}

/** Texto del reloj según el estado: cuánto falta para abrir, para cerrar, o cuándo cerró. */
export function CuentaRegresiva({ subasta, className, grande = false, enLinea = false }: { subasta: Pick<SubastaResumen, "estado" | "modalidad" | "fecha_inicio" | "fecha_fin">; className?: string; grande?: boolean; enLinea?: boolean }) {
  const ahora = useAhora();
  let etiqueta = "";
  let valor = "";
  let urgente = false;

  if (subasta.estado === "proxima") {
    const falta = new Date(subasta.fecha_inicio).getTime() - ahora;
    etiqueta = subasta.modalidad === "en_vivo" ? "Programada para" : "Abre en";
    valor = subasta.modalidad === "en_vivo" || falta > 86400000 ? fechaHora(subasta.fecha_inicio) : tiempoRestante(falta);
  } else if (subasta.estado === "activa" && subasta.fecha_fin) {
    const falta = new Date(subasta.fecha_fin).getTime() - ahora;
    etiqueta = "Cierra en";
    valor = tiempoRestante(falta);
    urgente = falta < 5 * 60 * 1000;
  } else if (subasta.estado === "activa") {
    etiqueta = "Estado";
    valor = "Martillo abierto";
  } else {
    etiqueta = subasta.estado === "cancelada" ? "Cancelada" : "Cerró";
    valor = fechaHora(subasta.fecha_fin);
  }

  if (enLinea) {
    return (
      <p className={clsx("text-[11px] text-muted-foreground whitespace-nowrap", className)}>
        {etiqueta} <span className={clsx("font-semibold tabular-nums text-foreground", urgente && "text-destructive")}>{valor}</span>
      </p>
    );
  }

  return (
    <div className={className}>
      <p className={clsx("text-muted-foreground", grande ? "text-xs" : "text-[11px]")}>{etiqueta}</p>
      <p className={clsx("font-semibold tabular-nums", grande ? "text-xl" : "text-sm", urgente && "text-destructive")}>{valor}</p>
    </div>
  );
}

export function TarjetaSubasta({ subasta, href }: { subasta: SubastaResumen; href: string }) {
  const imagen = urlMedia(subasta.imagen_principal);
  const precio = subasta.precio_actual ?? subasta.precio_inicial;
  return (
    <Link to={href} className="group flex flex-col bg-card border border-border rounded-2xl overflow-hidden hover:shadow-lg hover:-translate-y-0.5 transition-all zarpi-pop">
      <div className="relative aspect-[4/3] bg-muted overflow-hidden">
        {imagen
          ? <img src={imagen} alt={subasta.titulo} loading="lazy" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
          : <div className="w-full h-full flex items-center justify-center text-muted-foreground"><ImageOff className="w-8 h-8" /></div>}
        <div className="absolute top-3 left-3 right-3 flex flex-wrap gap-1.5">
          <EtiquetaEstado subasta={subasta} />
          {subasta.estado !== "activa" || subasta.modalidad !== "en_vivo" ? <EtiquetaModalidad modalidad={subasta.modalidad} sobreImagen /> : null}
        </div>
      </div>
      <div className="flex-1 flex flex-col p-4 gap-3">
        <div className="min-w-0">
          <p className="text-[11px] uppercase tracking-wider text-primary dark:text-accent font-semibold">{subasta.categoria}</p>
          <h3 className="text-sm font-semibold leading-snug line-clamp-2 mt-0.5">{subasta.titulo}</h3>
          <p className="text-xs text-muted-foreground mt-1 truncate">
            {subasta.subastador.empresa_nombre}
            {subasta.ubicacion && <> · <MapPin className="inline w-3 h-3 -mt-0.5" /> {subasta.ubicacion}</>}
          </p>
        </div>
        <div className="mt-auto pt-3 border-t border-border">
          <p className="text-[11px] text-muted-foreground">{subasta.precio_actual ? "Puja actual" : "Precio inicial"}</p>
          <p className="text-lg font-bold tabular-nums truncate">{dineroCorto(precio)} <span className="text-xs font-medium text-muted-foreground">{subasta.moneda}</span></p>
          <div className="flex items-center justify-between gap-2 mt-1.5">
            <p className="text-[11px] text-muted-foreground flex items-center gap-1 whitespace-nowrap"><Gavel className="w-3 h-3" />{subasta.total_pujas} {subasta.total_pujas === 1 ? "puja" : "pujas"}</p>
            <CuentaRegresiva subasta={subasta} enLinea className="truncate" />
          </div>
        </div>
      </div>
    </Link>
  );
}
