import clsx from "clsx";
import { ArrowLeft, ExternalLink, MessageCircle } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import { useEventos } from "../app/enVivo";
import { usePanel } from "../app/Panel";
import { useSesion } from "../app/sesion";
import { VentanaChat } from "../components/chat";
import { Cargando, Vacio } from "../components/ui";
import { api, urlMedia } from "../lib/api";
import { haceCuanto } from "../lib/formato";
import type { Conversacion, Mensaje } from "../lib/types";

export default function Mensajes() {
  const { conversacionId } = useParams();
  const { usuario } = useSesion();
  const { refrescarContadores } = usePanel();
  const navegar = useNavigate();
  const [conversaciones, setConversaciones] = useState<Conversacion[] | null>(null);
  const [mensajes, setMensajes] = useState<Mensaje[]>([]);
  const [cargandoMensajes, setCargandoMensajes] = useState(false);

  const cargarConversaciones = useCallback(() => {
    api.conversaciones().then(setConversaciones).catch(() => setConversaciones([]));
  }, []);

  useEffect(cargarConversaciones, [cargarConversaciones]);

  useEffect(() => {
    if (!conversacionId) return;
    setCargandoMensajes(true);
    api.mensajes(conversacionId)
      .then((m) => {
        setMensajes(m);
        // Abrirla la marca como leída en el servidor.
        setConversaciones((lista) => lista?.map((c) => (c.id === conversacionId ? { ...c, no_leidos: 0 } : c)) ?? lista);
        refrescarContadores();
      })
      .catch(() => setMensajes([]))
      .finally(() => setCargandoMensajes(false));
  }, [conversacionId, refrescarContadores]);

  useEventos((e) => {
    if (e.tipo !== "mensaje_privado") return;
    const { mensaje } = e;
    if (mensaje.conversacion_id === conversacionId) {
      setMensajes((l) => (l.some((m) => m.id === mensaje.id) ? l : [...l, mensaje]));
      // Se está viendo: se vuelve a pedir para dejarla leída.
      if (mensaje.remitente_id !== usuario?.id) api.mensajes(mensaje.conversacion_id!).then(() => refrescarContadores()).catch(() => {});
    }
    setConversaciones((lista) => {
      if (!lista) return lista;
      const existe = lista.find((c) => c.id === mensaje.conversacion_id);
      if (!existe) { cargarConversaciones(); return lista; }
      const actualizada = {
        ...existe,
        ultimo_mensaje: mensaje.contenido,
        fecha_ultimo_mensaje: mensaje.fecha,
        no_leidos: mensaje.conversacion_id === conversacionId || mensaje.remitente_id === usuario?.id ? existe.no_leidos : existe.no_leidos + 1,
      };
      return [actualizada, ...lista.filter((c) => c.id !== existe.id)];
    });
  });

  async function enviar(texto: string) {
    if (!conversacionId) return;
    const mensaje = await api.escribirPrivado(conversacionId, texto);
    setMensajes((l) => (l.some((m) => m.id === mensaje.id) ? l : [...l, mensaje]));
  }

  if (conversaciones === null) return <Cargando />;
  const activa = conversaciones.find((c) => c.id === conversacionId);

  if (conversaciones.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6">
        <h1 className="text-xl font-semibold tracking-tight mb-6">Mensajes</h1>
        <Vacio
          icono={<MessageCircle className="w-6 h-6" />}
          titulo="Aún no tienes conversaciones"
          texto={usuario?.rol === "subastador"
            ? "Aquí te escribirán los clientes con preguntas, y se abrirá un chat con cada ganador para coordinar el pago."
            : "Desde cualquier subasta puedes escribirle a la empresa. Si ganas un lote, el chat con la empresa se abre solo."}
        />
      </div>
    );
  }

  return (
    <div className="h-full flex">
      <aside className={clsx("w-full md:w-80 flex-shrink-0 border-r border-border bg-card flex flex-col", conversacionId && "hidden md:flex")}>
        <div className="px-4 h-14 flex items-center border-b border-border"><h1 className="text-base font-semibold">Mensajes</h1></div>
        <div className="flex-1 overflow-y-auto divide-y divide-border zarpi-stagger">
          {conversaciones.map((c) => (
            <button key={c.id} onClick={() => navegar(`/app/mensajes/${c.id}`)} className={clsx("w-full flex gap-3 px-4 py-3 text-left transition-colors", c.id === conversacionId ? "bg-primary/5 dark:bg-accent/10" : "hover:bg-muted/60")}>
              <img src={urlMedia(c.subasta_imagen)} alt="" className="w-11 h-11 rounded-lg object-cover bg-muted flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className={clsx("text-sm truncate", c.no_leidos > 0 ? "font-semibold" : "font-medium")}>{c.contraparte}</p>
                  {c.fecha_ultimo_mensaje && <span className="text-[10px] text-muted-foreground flex-shrink-0">{haceCuanto(c.fecha_ultimo_mensaje)}</span>}
                </div>
                <p className="text-xs text-muted-foreground truncate">{c.subasta_titulo}</p>
                <div className="flex items-center gap-2">
                  <p className="text-xs text-muted-foreground truncate flex-1">{c.ultimo_mensaje ?? "Sin mensajes todavía"}</p>
                  {c.no_leidos > 0 && <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">{c.no_leidos}</span>}
                </div>
              </div>
            </button>
          ))}
        </div>
      </aside>

      <section className={clsx("flex-1 min-w-0 flex flex-col bg-background", !conversacionId && "hidden md:flex")}>
        {!activa ? (
          <div className="flex-1 flex items-center justify-center p-6 text-sm text-muted-foreground">Elige una conversación.</div>
        ) : (
          <>
            <div className="h-14 flex items-center gap-3 px-3 sm:px-4 border-b border-border bg-card">
              <button onClick={() => navegar("/app/mensajes")} aria-label="Volver" className="md:hidden w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-muted"><ArrowLeft className="w-4 h-4" /></button>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold truncate">{activa.contraparte}</p>
                <p className="text-xs text-muted-foreground truncate">{activa.subasta_titulo}</p>
              </div>
              <Link to={`/app/subastas/${activa.subasta_id}`} className="inline-flex items-center gap-1 text-xs font-medium text-primary dark:text-accent hover:underline flex-shrink-0">Ver subasta<ExternalLink className="w-3 h-3" /></Link>
            </div>
            {cargandoMensajes ? <Cargando /> : (
              <VentanaChat className="flex-1" mensajes={mensajes} miId={usuario?.id} alEnviar={enviar} />
            )}
          </>
        )}
      </section>
    </div>
  );
}
