import { Gavel, PackagePlus, Radio, Trophy } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { TarjetaSubasta } from "../components/subasta";
import { Button, Card, Cargando, Encabezado, Pagina, Vacio, useSelectionIndicator } from "../components/ui";
import { useSubastasEnVivo } from "../components/useSubastasEnVivo";
import { api } from "../lib/api";
import { dinero } from "../lib/formato";
import type { SubastaResumen } from "../lib/types";
import { clsx } from "clsx";

type Filtro = "vigentes" | "finalizadas" | "todas";

export default function MisSubastas() {
  const [datos, setDatos] = useState<SubastaResumen[] | null>(null);
  const [filtro, setFiltro] = useState<Filtro>("vigentes");
  const indicador = useSelectionIndicator(filtro);
  const subastas = useSubastasEnVivo(datos ?? []);

  useEffect(() => {
    api.misSubastas().then(setDatos).catch(() => setDatos([]));
  }, []);

  const resumen = useMemo(() => {
    const adjudicadas = subastas.filter((s) => s.resultado === "adjudicada");
    return {
      activas: subastas.filter((s) => s.estado === "activa").length,
      enVivo: subastas.filter(
        (s) => s.estado === "activa" && s.modalidad === "en_vivo"
      ).length,
      pujas: subastas
        .filter((s) => s.estado === "activa")
        .reduce((t, s) => t + s.total_pujas, 0),
      adjudicadas: adjudicadas.length,
      vendido: adjudicadas.reduce((t, s) => t + (s.precio_actual ?? 0), 0),
    };
  }, [subastas]);

  const visibles = subastas.filter((s) =>
    filtro === "todas"
      ? true
      : filtro === "vigentes"
      ? s.estado === "activa" || s.estado === "proxima"
      : s.estado === "finalizada" || s.estado === "cancelada"
  );

  const nueva = (
    <Link to="/app/nueva">
      <Button
        icon={<PackagePlus className="w-4 h-4" />}
        className="dark:bg-accent dark:text-accent-foreground dark:hover:bg-accent/90 transition-colors"
      >
        Nueva subasta
      </Button>
    </Link>
  );

  const opcionesFiltro: { valor: Filtro; texto: string }[] = [
    { valor: "vigentes", texto: "Activas y próximas" },
    { valor: "finalizadas", texto: "Terminadas" },
    { valor: "todas", texto: "Todas" },
  ];

  return (
    <Pagina>
      <Encabezado
        titulo="Mis subastas"
        descripcion="Publica lotes, sigue las pujas en vivo y adjudica tu mercancía."
        accion={nueva}
      />

      {/* TARJETAS DE RESUMEN / INDICADORES */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Indicador
          icono={<Gavel className="w-5 h-5" />}
          titulo="Subastas activas"
          valor={String(resumen.activas)}
        />
        <Indicador
          icono={<Radio className="w-5 h-5" />}
          titulo="En vivo ahora"
          valor={String(resumen.enVivo)}
        />
        <Indicador
          icono={<Gavel className="w-5 h-5" />}
          titulo="Pujas en curso"
          valor={String(resumen.pujas)}
        />
        <Indicador
          icono={<Trophy className="w-5 h-5" />}
          titulo={`${resumen.adjudicadas} adjudicadas`}
          valor={dinero(resumen.vendido)}
        />
      </div>

      {/* BARRA DE FILTROS / SEGMENTOS ADAPTATIVA */}
      <div ref={indicador.containerRef} className="relative mb-5 p-1 rounded-xl bg-muted/60 dark:bg-card border border-border inline-flex flex-wrap gap-1">
        <span
          aria-hidden="true"
          className="absolute pointer-events-none rounded-lg transition-[transform,width,height,opacity] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none bg-primary dark:bg-accent"
          style={indicador.style}
        />
        {opcionesFiltro.map((op) => {
          const seleccionada = filtro === op.valor;
          return (
            <button
              key={op.valor}
              ref={indicador.registerItem(op.valor)}
              type="button"
              onClick={() => setFiltro(op.valor)}
              className={clsx(
                "relative z-10 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-colors duration-200 ease-in-out cursor-pointer",
                seleccionada
                  ? "!text-white shadow-sm dark:!text-black"
                  : "text-muted-foreground hover:bg-primary/10 hover:text-primary dark:hover:bg-accent/15 dark:hover:text-accent"
              )}
            >
              {op.texto}
            </button>
          );
        })}
      </div>

      {/* LISTADO DE SUBASTAS */}
      {datos === null ? (
        <Cargando />
      ) : visibles.length === 0 ? (
        <Vacio
          icono={<PackagePlus className="w-6 h-6" />}
          titulo={
            filtro === "finalizadas"
              ? "Aún no tienes subastas terminadas"
              : "No tienes subastas en curso"
          }
          texto="Sube fotos de tu mercancía represada, define el precio inicial y elige si la subastas por tiempo o en vivo."
          accion={nueva}
        />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 zarpi-stagger">
          {visibles.map((s) => (
            <TarjetaSubasta
              key={s.id}
              subasta={s}
              href={`/app/subastas/${s.id}`}
            />
          ))}
        </div>
      )}
    </Pagina>
  );
}

function Indicador({
  icono,
  titulo,
  valor,
}: {
  icono: React.ReactNode;
  titulo: string;
  valor: string;
}) {
  return (
    <Card className="flex items-center gap-3 bg-card border-border text-card-foreground">
      <span className="w-10 h-10 rounded-xl bg-primary/10 text-primary dark:bg-accent/15 dark:text-accent flex items-center justify-center flex-shrink-0">
        {icono}
      </span>
      <div className="min-w-0">
        <p className="text-lg font-bold truncate tabular-nums text-foreground">
          {valor}
        </p>
        <p className="text-xs text-muted-foreground truncate">{titulo}</p>
      </div>
    </Card>
  );
}