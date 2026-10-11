import clsx from "clsx";
import { Bell, CheckCheck, Gavel, Hammer, MessageCircle, Trophy } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { useEventos } from "../app/enVivo";
import { usePanel } from "../app/Panel";
import { Button, Cargando, Encabezado, Pagina, Vacio } from "../components/ui";
import { api } from "../lib/api";
import { haceCuanto } from "../lib/formato";
import type { Notificacion } from "../lib/types";

const ICONOS: Record<string, React.ReactNode> = {
  ganaste: <Trophy className="w-4 h-4" />,
  adjudicada: <Hammer className="w-4 h-4" />,
  superado: <Gavel className="w-4 h-4" />,
};

export default function Notificaciones() {
  const { refrescarContadores } = usePanel();
  const navegar = useNavigate();
  const [lista, setLista] = useState<Notificacion[] | null>(null);
  const [confirmando, setConfirmando] = useState(false);

  useEffect(() => { api.notificaciones().then(setLista).catch(() => setLista([])); }, []);
  useEventos((e) => {
    if (e.tipo === "notificacion") setLista((l) => [e.notificacion, ...(l ?? [])]);
  });

  async function abrir(n: Notificacion) {
    if (!n.leida) {
      await api.leerNotificacion(n.id).catch(() => {});
      refrescarContadores();
    }
    if (n.subasta_id) navegar(`/app/subastas/${n.subasta_id}`);
  }

  async function leerTodas() {
    await api.leerTodas();
    setLista((l) => (l ?? []).map((n) => ({ ...n, leida: true })));
    refrescarContadores();
    setConfirmando(true);
    window.setTimeout(() => setConfirmando(false), 900);
  }

  const sinLeer = (lista ?? []).filter((n) => !n.leida).length;

  return (
    <Pagina className="max-w-3xl">
      <Encabezado
        titulo="Notificaciones"
        descripcion={sinLeer ? `${sinLeer} sin leer` : "Estás al día"}
        accion={sinLeer > 0 || confirmando ? (
          <Button
            variant="primary"
            size="sm"
            className={clsx("dark:bg-accent dark:text-accent-foreground", confirmando && "zarpi-confirm")}
            icon={<CheckCheck className={clsx("w-4 h-4", confirmando && "animate-pulse")} />}
            onClick={leerTodas}
            disabled={confirmando}
          >
            {confirmando ? "Todas leídas" : "Marcar todas como leídas"}
          </Button>
        ) : undefined}
      />
      {lista === null ? <Cargando /> : lista.length === 0 ? (
        <Vacio icono={<Bell className="w-6 h-6" />} titulo="No tienes notificaciones" texto="Te avisaremos cuando te superen en una puja, ganes un lote o cierre una de tus subastas." />
      ) : (
        <div className="bg-card border border-border rounded-xl divide-y divide-border overflow-hidden zarpi-stagger">
          {lista.map((n) => (
            <button key={n.id} onClick={() => abrir(n)} className={clsx("w-full flex items-start gap-3 px-4 py-3.5 text-left hover:bg-muted/60 transition-colors", !n.leida && "bg-primary/5 dark:bg-accent/5")}>
              <span className={clsx("w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0", n.tipo === "ganaste" ? "bg-accent text-accent-foreground" : "bg-primary/10 text-primary dark:bg-accent/15 dark:text-accent")}>
                {ICONOS[n.tipo] ?? <MessageCircle className="w-4 h-4" />}
              </span>
              <div className="flex-1 min-w-0">
                <p className={clsx("text-sm", !n.leida && "font-semibold")}>{n.titulo}</p>
                <p className="text-sm text-muted-foreground">{n.mensaje}</p>
                <p className="text-xs text-muted-foreground mt-1">{haceCuanto(n.fecha)}</p>
              </div>
              {!n.leida && <span className="w-2 h-2 rounded-full bg-primary dark:bg-accent mt-2 flex-shrink-0" />}
            </button>
          ))}
        </div>
      )}
    </Pagina>
  );
}
