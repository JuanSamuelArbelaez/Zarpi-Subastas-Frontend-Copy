import { useEffect, useState } from "react";

import { useEnVivo, useEventos } from "../app/enVivo";
import type { SubastaResumen } from "../lib/types";

/**
 * Mantiene una lista de subastas al día con las pujas y cambios de estado que
 * llegan por WebSocket, sin volver a pedirla al servidor.
 */
export function useSubastasEnVivo(iniciales: SubastaResumen[]) {
  const { seguirSubasta } = useEnVivo();
  const [subastas, setSubastas] = useState(iniciales);

  useEffect(() => setSubastas(iniciales), [iniciales]);

  const ids = subastas.map((s) => s.id).join(",");
  useEffect(() => {
    const soltar = ids ? ids.split(",").map((id) => seguirSubasta(id)) : [];
    return () => soltar.forEach((f) => f());
  }, [ids, seguirSubasta]);

  useEventos((evento) => {
    if (evento.tipo === "puja") {
      setSubastas((lista) => lista.map((s) => s.id === evento.subasta_id
        ? { ...s, precio_actual: evento.precio_actual, minimo_siguiente: evento.minimo_siguiente, total_pujas: evento.total_pujas, fecha_fin: evento.fecha_fin }
        : s));
    } else if (evento.tipo === "estado") {
      setSubastas((lista) => lista.map((s) => (s.id === evento.subasta_id ? evento.subasta : s)));
    }
  });

  return subastas;
}
