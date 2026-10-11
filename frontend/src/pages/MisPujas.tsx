import clsx from "clsx";
import { Gavel, Trophy } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { useEnVivo, useEventos } from "../app/enVivo";
import { CuentaRegresiva } from "../components/subasta";
import { Button, Cargando, Encabezado, Pagina, Pildora, Segmentos, Vacio } from "../components/ui";
import { api, urlMedia } from "../lib/api";
import { dinero } from "../lib/formato";
import type { MiPuja } from "../lib/types";

type Filtro = "activas" | "ganadas" | "todas";

const SITUACIONES: Record<string, { texto: string; clase: string }> = {
  ganando: { texto: "Vas ganando", clase: "bg-emerald-100 text-emerald-800 dark:!bg-accent dark:!text-accent-foreground" },
  superado: { texto: "Te superaron", clase: "bg-amber-100 text-amber-800 dark:!bg-accent dark:!text-accent-foreground" },
  ganada: { texto: "Ganaste", clase: "bg-accent text-accent-foreground dark:!bg-accent dark:!text-accent-foreground" },
  perdida: { texto: "No ganaste", clase: "bg-muted text-muted-foreground dark:!bg-accent dark:!text-accent-foreground" },
  finalizada: { texto: "Finalizada", clase: "bg-muted text-muted-foreground dark:!bg-accent dark:!text-accent-foreground" },
  cancelada: { texto: "Cancelada", clase: "bg-muted text-muted-foreground dark:!bg-accent dark:!text-accent-foreground" },
};

export default function MisPujas() {
  const { seguirSubasta } = useEnVivo();
  const [pujas, setPujas] = useState<MiPuja[] | null>(null);
  const [filtro, setFiltro] = useState<Filtro>("activas");

  const cargar = () => api.misPujas().then(setPujas).catch(() => setPujas([]));
  useEffect(() => { cargar(); }, []);

  const ids = (pujas ?? []).filter((p) => p.subasta.estado === "activa").map((p) => p.subasta.id).join(",");
  useEffect(() => {
    const soltar = ids ? ids.split(",").map(seguirSubasta) : [];
    return () => soltar.forEach((f) => f());
  }, [ids, seguirSubasta]);

  // Cualquier puja o cierre en mis subastas cambia mi situación: se vuelve a pedir la lista.
  useEventos((e) => {
    if ((e.tipo === "puja" || e.tipo === "estado") && ids.includes(e.subasta_id)) cargar();
  });

  const visibles = useMemo(() => (pujas ?? []).filter((p) => {
    if (filtro === "activas") return p.subasta.estado === "activa" || p.subasta.estado === "proxima";
    if (filtro === "ganadas") return p.situacion === "ganada";
    return true;
  }), [pujas, filtro]);

  const ganando = (pujas ?? []).filter((p) => p.situacion === "ganando").length;
  const ganadas = (pujas ?? []).filter((p) => p.situacion === "ganada").length;

  return (
    <Pagina className="max-w-5xl">
      <Encabezado titulo="Mis pujas" descripcion={pujas ? `Vas ganando ${ganando} ${ganando === 1 ? "subasta" : "subastas"} · ${ganadas} ${ganadas === 1 ? "lote ganado" : "lotes ganados"}` : undefined} />
      <div className="mb-5">
        <Segmentos<Filtro> valor={filtro} alCambiar={setFiltro} opciones={[
          { valor: "activas", texto: "En curso" },
          { valor: "ganadas", texto: "Ganadas" },
          { valor: "todas", texto: "Todas" },
        ]} />
      </div>
      {pujas === null ? <Cargando /> : visibles.length === 0 ? (
        <Vacio
          icono={filtro === "ganadas" ? <Trophy className="w-6 h-6" /> : <Gavel className="w-6 h-6" />}
          titulo={filtro === "ganadas" ? "Aún no has ganado lotes" : "No tienes pujas en curso"}
          texto="Explora las subastas activas y haz tu primera puja. No pagas nada al pujar."
          accion={<Link to="/app/subastas"><Button className="dark:bg-accent dark:text-black hover:dark:bg-accent/80">Ver subastas</Button></Link>}
        />
      ) : (
        <div className="space-y-3 zarpi-stagger">
          {visibles.map(({ subasta, mi_puja_maxima, situacion }) => {
            const etiqueta = SITUACIONES[situacion] ?? SITUACIONES.finalizada;
            return (
              <Link key={subasta.id} to={`/app/subastas/${subasta.id}`} className="flex gap-4 items-center bg-card border border-border rounded-xl p-3 hover:shadow-md transition-shadow">
                <img src={urlMedia(subasta.imagen_principal)} alt="" className="w-20 h-20 sm:w-24 sm:h-20 rounded-lg object-cover bg-muted flex-shrink-0" />
                <div className="flex-1 min-w-0 grid sm:grid-cols-[1fr_auto_auto] gap-x-6 gap-y-1 items-center">
                  <div className="min-w-0">
                    <Pildora className={clsx("mb-1", etiqueta.clase)}>{etiqueta.texto}</Pildora>
                    <p className="text-sm font-semibold truncate">{subasta.titulo}</p>
                    <p className="text-xs text-muted-foreground truncate">{subasta.subastador.empresa_nombre}</p>
                  </div>
                  <div className="text-xs sm:text-right">
                    <p className="text-muted-foreground">Tu puja · Actual</p>
                    <p className="font-semibold tabular-nums">{dinero(mi_puja_maxima)} · {dinero(subasta.precio_actual)}</p>
                  </div>
                  <CuentaRegresiva subasta={subasta} className="text-xs sm:text-right" />
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </Pagina>
  );
}
