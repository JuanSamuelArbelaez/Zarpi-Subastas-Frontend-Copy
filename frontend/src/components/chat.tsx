import clsx from "clsx";
import { Info, Send } from "lucide-react";
import { useEffect, useRef, useState, type FormEvent } from "react";

import { hora } from "../lib/formato";
import type { Mensaje } from "../lib/types";

export function BurbujaMensaje({ mensaje, propio }: { mensaje: Mensaje; propio: boolean }) {
  if (mensaje.es_sistema) {
    return (
      <div className="flex justify-center">
        <p className="max-w-[90%] flex items-start gap-1.5 rounded-xl bg-accent/40 dark:bg-accent/15 text-foreground px-3 py-2 text-xs">
          <Info className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />{mensaje.contenido}
        </p>
      </div>
    );
  }
  return (
    <div className={clsx("flex flex-col", propio ? "items-end" : "items-start")}>
      {!propio && (
        <span className={clsx("text-[11px] mb-0.5 px-1 font-medium", mensaje.es_subastador ? "text-primary dark:text-accent" : "text-muted-foreground")}>
          {mensaje.remitente}{mensaje.es_subastador && " · Empresa"}
        </span>
      )}
      <div className={clsx(
        "max-w-[85%] rounded-2xl px-3 py-2 text-sm whitespace-pre-wrap break-words",
        propio ? "bg-primary text-primary-foreground rounded-br-md" : "bg-muted text-foreground rounded-bl-md",
      )}>
        {mensaje.contenido}
      </div>
      <span className="text-[10px] text-muted-foreground mt-0.5 px-1">{hora(mensaje.fecha)}</span>
    </div>
  );
}

/** Lista de mensajes con caja de texto; baja sola al final cuando llega algo nuevo. */
export function VentanaChat({ mensajes, miId, alEnviar, alPedirAcceso, deshabilitado, aviso, placeholder = "Escribe un mensaje…", className }: {
  mensajes: Mensaje[];
  miId?: string;
  alEnviar?: (texto: string) => Promise<void>;
  /** Para visitantes: la caja de texto solo invita a entrar o registrarse. */
  alPedirAcceso?: () => void;
  deshabilitado?: boolean;
  aviso?: string;
  placeholder?: string;
  className?: string;
}) {
  const [texto, setTexto] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState("");
  const fin = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fin.current?.scrollIntoView({ block: "end" });
  }, [mensajes.length]);

  async function enviar(e: FormEvent) {
    e.preventDefault();
    const limpio = texto.trim();
    if (!limpio || !alEnviar) return;
    setEnviando(true);
    setError("");
    try {
      await alEnviar(limpio);
      setTexto("");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className={clsx("flex flex-col min-h-0", className)}>
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {mensajes.length === 0 && <p className="text-center text-xs text-muted-foreground py-8">Todavía no hay mensajes.</p>}
        {mensajes.map((m) => <BurbujaMensaje key={m.id} mensaje={m} propio={!!miId && m.remitente_id === miId} />)}
        <div ref={fin} />
      </div>
      {aviso ? (
        <p className="border-t border-border px-4 py-3 text-xs text-muted-foreground text-center">{aviso}</p>
      ) : alPedirAcceso ? (
        <div className="border-t border-border p-2.5">
          <button
            type="button"
            onClick={alPedirAcceso}
            className="w-full h-9 flex items-center gap-2 rounded-lg border border-border bg-input-background pl-3 pr-1 text-sm text-muted-foreground text-left hover:border-primary/40 dark:hover:border-accent/40"
          >
            <span className="flex-1 min-w-0 truncate">Inicia sesión o regístrate para escribir…</span>
            <span className="w-7 h-7 flex-shrink-0 rounded-md bg-primary text-primary-foreground dark:bg-accent dark:text-accent-foreground flex items-center justify-center opacity-60"><Send className="w-3.5 h-3.5" /></span>
          </button>
        </div>
      ) : alEnviar ? (
        <form onSubmit={enviar} className="border-t border-border p-2.5 flex items-center gap-2">
          <input
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            maxLength={1000}
            disabled={deshabilitado}
            placeholder={placeholder}
            aria-label="Mensaje"
            className="flex-1 min-w-0 h-9 rounded-lg border border-border bg-input-background px-3 text-sm text-foreground placeholder:text-muted-foreground/70 focus:outline-none focus:ring-2 focus:ring-primary/30 dark:bg-[#1b1b1b] dark:text-[#d0d0d0] dark:focus:ring-accent/30"
          />
          <button type="submit" disabled={enviando || !texto.trim() || deshabilitado} aria-label="Enviar" className="w-9 h-9 flex-shrink-0 rounded-lg bg-primary text-primary-foreground dark:bg-accent dark:text-accent-foreground flex items-center justify-center disabled:opacity-40">
            <Send className="w-4 h-4" />
          </button>
        </form>
      ) : null}
      {error && <p className="px-4 pb-2 text-xs text-destructive">{error}</p>}
    </div>
  );
}
