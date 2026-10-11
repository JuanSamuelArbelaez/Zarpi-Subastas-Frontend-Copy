import clsx from "clsx";
import { Loader2, PartyPopper, X } from "lucide-react";
import { useEffect, useId, useLayoutEffect, useRef, useState, type ButtonHTMLAttributes, type HTMLAttributes, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from "react";

import { useTema } from "../lib/tema";

// Componentes base copiados del sistema de Zarpi (ImportacionesQ8) para que las
// dos plataformas se sientan de la misma familia.

type VarianteBoton = "primary" | "secondary" | "danger" | "ghost" | "accent";

interface PropsBoton extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: VarianteBoton;
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  fullWidth?: boolean;
  icon?: ReactNode;
  iconRight?: ReactNode;
}

export function Button({ variant = "primary", size = "md", loading = false, fullWidth = false, icon, iconRight, children, className, disabled, ...props }: PropsBoton) {
  const base = "inline-flex items-center justify-center gap-1.5 font-medium rounded-lg transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed select-none";
  const variantes: Record<VarianteBoton, string> = {
    primary: "bg-primary text-primary-foreground hover:bg-[#3f05bc] active:bg-[#2e038a] dark:bg-accent dark:text-accent-foreground dark:hover:bg-accent/80 dark:active:bg-accent/70 shadow-sm",
    secondary: "bg-muted text-foreground border border-border hover:bg-accent hover:text-accent-foreground hover:border-accent shadow-sm",
    danger: "bg-destructive text-white hover:bg-red-700 shadow-sm",
    ghost: "text-muted-foreground hover:text-foreground hover:bg-muted",
    accent: "bg-accent text-accent-foreground hover:bg-accent/85 shadow-sm",
  };
  const tamanos = { sm: "h-8 px-3 text-xs", md: "h-9 px-4 text-sm", lg: "h-11 px-5 text-sm" };
  return (
    <button className={clsx(base, variantes[variant], tamanos[size], fullWidth && "w-full", className)} disabled={disabled || loading} {...props}>
      {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : icon}
      {children}
      {!loading && iconRight}
    </button>
  );
}

export function Card({ children, className, padding = "md", ...props }: HTMLAttributes<HTMLDivElement> & { padding?: "none" | "sm" | "md" | "lg" }) {
  const p = { none: "", sm: "p-4", md: "p-5", lg: "p-6" };
  return <div className={clsx("bg-card text-card-foreground border border-border rounded-xl shadow-sm zarpi-enter", p[padding], className)} {...props}>{children}</div>;
}

interface PropsCampo {
  label?: string;
  hint?: string;
  error?: string;
  prefix?: ReactNode;
  suffix?: ReactNode;
}

const claseCampo = "w-full rounded-lg border border-border bg-input-background px-3 text-sm text-foreground placeholder:text-muted-foreground/70 transition-colors focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary dark:bg-[#1b1b1b] dark:text-[#d0d0d0] dark:focus:ring-accent/30 dark:focus:border-accent disabled:opacity-60";

function Envoltura({ id, label, hint, error, children }: PropsCampo & { id: string; children: ReactNode }) {
  return (
    <div className="space-y-1.5">
      {label && <label htmlFor={id} className="block text-xs font-medium text-foreground">{label}</label>}
      {children}
      {error ? <p className="text-xs text-destructive">{error}</p> : hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

export function Input({ label, hint, error, prefix, suffix, className, id, ...props }: PropsCampo & Omit<InputHTMLAttributes<HTMLInputElement>, "prefix">) {
  const auto = useId();
  const campoId = id ?? auto;
  return (
    <Envoltura id={campoId} label={label} hint={hint} error={error}>
      <div className="relative flex items-center">
        {prefix && <span className="absolute left-3 text-sm text-muted-foreground pointer-events-none">{prefix}</span>}
        <input id={campoId} className={clsx(claseCampo, "h-10", prefix && "pl-8", suffix && "pr-14", error && "border-destructive", className)} {...props} />
        {suffix && <span className="absolute right-3 text-xs text-muted-foreground pointer-events-none">{suffix}</span>}
      </div>
    </Envoltura>
  );
}

export function Textarea({ label, hint, error, className, id, ...props }: PropsCampo & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const auto = useId();
  const campoId = id ?? auto;
  return (
    <Envoltura id={campoId} label={label} hint={hint} error={error}>
      <textarea id={campoId} className={clsx(claseCampo, "py-2 min-h-[110px] resize-y", className)} {...props} />
    </Envoltura>
  );
}

export function Select({ label, hint, error, className, id, children, ...props }: PropsCampo & SelectHTMLAttributes<HTMLSelectElement>) {
  const auto = useId();
  const campoId = id ?? auto;
  return (
    <Envoltura id={campoId} label={label} hint={hint} error={error}>
      <select id={campoId} className={clsx(claseCampo, "h-10", className)} {...props}>{children}</select>
    </Envoltura>
  );
}

/** "zarpi" + "subastas": el wordmark de Zarpi con el nombre de la línea al lado. */
export function Logo({ claro = false, className }: { claro?: boolean; className?: string }) {
  const { oscuro } = useTema();
  const acid = claro || oscuro;
  return (
    <span className={clsx("inline-flex items-center gap-2", className)}>
      <img 
        src={acid ? "/brand/zarpi-wordmark-acid.svg" : "/brand/zarpi-wordmark.svg"} 
        alt="Zarpi" 
        className="h-7 w-[84px] object-contain object-left" 
      />
      <span className={clsx(
        "flex items-center justify-center leading-none font-accent text-[11px] font-bold uppercase p-2 rounded-full",
        acid ? "bg-accent text-accent-foreground" : "bg-primary text-primary-foreground",
      )}>
        subastas
      </span>
    </span>
  );
}

export function Modal({ abierto, alCerrar, titulo, children, ancho = "max-w-lg" }: { abierto: boolean; alCerrar: () => void; titulo: string; children: ReactNode; ancho?: string }) {
  useEffect(() => {
    if (!abierto) return;
    const alTeclear = (e: KeyboardEvent) => e.key === "Escape" && alCerrar();
    window.addEventListener("keydown", alTeclear);
    return () => window.removeEventListener("keydown", alTeclear);
  }, [abierto, alCerrar]);
  if (!abierto) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={alCerrar} />
      <div role="dialog" aria-modal="true" aria-label={titulo} className={clsx("relative w-full bg-card border border-border rounded-2xl shadow-2xl zarpi-pop", ancho)}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h2 className="text-base font-semibold">{titulo}</h2>
          <button onClick={alCerrar} aria-label="Cerrar" className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-muted"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

export function Cargando({ texto = "Cargando…" }: { texto?: string }) {
  return (
    <div className="flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground zarpi-enter">
      <Loader2 className="w-4 h-4 animate-spin" />
      {texto}
    </div>
  );
}

export function Vacio({ icono, titulo, texto, accion }: { icono: ReactNode; titulo: string; texto?: string; accion?: ReactNode }) {
  return (
    <Card padding="lg" className="border-dashed">
      <div className="flex flex-col items-center text-center py-8 gap-3">
        <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center text-muted-foreground">{icono}</div>
        <div>
          <p className="font-semibold text-sm">{titulo}</p>
          {texto && <p className="text-sm text-muted-foreground mt-1 max-w-sm">{texto}</p>}
        </div>
        {accion}
      </div>
    </Card>
  );
}

export function Pildora({ children, className }: { children: ReactNode; className?: string }) {
  return <span className={clsx("inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-medium whitespace-nowrap", className)}>{children}</span>;
}

export function Celebracion({ visible }: { visible: boolean }) {
  if (!visible) return null;
  const piezas = Array.from({ length: 18 }, (_, i) => i);
  return (
    <div className="zarpi-celebracion" aria-hidden="true">
      <PartyPopper className="zarpi-corneta zarpi-corneta-left" />
      <PartyPopper className="zarpi-corneta zarpi-corneta-right" />
      <div className="zarpi-confeti">
        {piezas.map((pieza) => (
          <span
            key={pieza}
            className="zarpi-confeti-piece"
            style={{
              "--zarpi-index": pieza,
              "--zarpi-x": `${((pieza % 9) - 4) * 18}px`,
              "--zarpi-y": `${50 + (pieza % 5) * 11}px`,
              "--zarpi-rotate": `${(pieza - 9) * 35}deg`,
            } as React.CSSProperties}
          />
        ))}
      </div>
    </div>
  );
}

export function Pagina({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={clsx("max-w-7xl mx-auto px-4 sm:px-6 py-6", className)}>{children}</div>;
}

export function Encabezado({ titulo, descripcion, accion }: { titulo: string; descripcion?: string; accion?: ReactNode }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">{titulo}</h1>
        {descripcion && <p className="text-sm text-muted-foreground mt-0.5">{descripcion}</p>}
      </div>
      {accion}
    </div>
  );
}

export function useSelectionIndicator<T>(activeKey: T) {
  const containerRef = useRef<HTMLDivElement>(null);
  const itemsRef = useRef(new Map<T, HTMLElement>());
  const [style, setStyle] = useState({ left: 0, top: 0, width: 0, height: 0, opacity: 0 });

  const registerItem = (key: T) => (element: HTMLElement | null) => {
    if (element) itemsRef.current.set(key, element);
    else itemsRef.current.delete(key);
  };

  useLayoutEffect(() => {
    const update = () => {
      const container = containerRef.current;
      const active = itemsRef.current.get(activeKey);
      if (!container || !active) return;
      setStyle({
        left: active.offsetLeft,
        top: active.offsetTop,
        width: active.offsetWidth,
        height: active.offsetHeight,
        opacity: 1,
      });
    };
    update();
    const observer = new ResizeObserver(update);
    if (containerRef.current) observer.observe(containerRef.current);
    itemsRef.current.forEach((item) => observer.observe(item));
    return () => observer.disconnect();
  }, [activeKey]);

  return { containerRef, registerItem, style };
}

function SelectionIndicator({ style, className }: { style: { left: number; top: number; width: number; height: number; opacity: number }; className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={clsx("absolute pointer-events-none rounded-md transition-[left,top,width,height,opacity] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none bg-primary dark:bg-accent", className)}
      style={style}
    />
  );
}

/** Botones tipo pestaña para filtros cortos. */
export function Segmentos<T extends string>({ opciones, valor, alCambiar }: { opciones: { valor: T; texto: string }[]; valor: T; alCambiar: (v: T) => void }) {
  const indicador = useSelectionIndicator(valor);
  return (
    <div ref={indicador.containerRef} className="relative inline-flex flex-wrap gap-1 p-1 rounded-lg bg-muted border border-border dark:bg-[#1b1b1b]">
      <SelectionIndicator style={indicador.style} />
      {opciones.map((o) => (
        <button
          key={o.valor}
          ref={indicador.registerItem(o.valor)}
          type="button"
          onClick={() => alCambiar(o.valor)}
          aria-pressed={valor === o.valor}
          className={clsx(
            "relative z-10 px-3 h-7 rounded-md text-xs font-medium transition-colors duration-200 ease-in-out",
            valor === o.valor
              ? "text-primary-foreground shadow-sm dark:text-accent-foreground"
              : "text-muted-foreground hover:bg-primary/10 hover:text-primary dark:text-[#a0a0a0] dark:hover:bg-accent/20 dark:hover:text-accent",
          )}
        >
          {o.texto}
        </button>
      ))}
    </div>
  );
}

/** Campo de dinero: muestra 1.250.000 mientras se escribe y entrega el número. */
export function CampoMonto({ valor, alCambiar, moneda = "COP", ...props }: Omit<InputHTMLAttributes<HTMLInputElement>, "value" | "onChange" | "prefix"> & PropsCampo & { valor: number | null; alCambiar: (v: number | null) => void; moneda?: string }) {
  const texto = valor === null ? "" : new Intl.NumberFormat("es-CO", { maximumFractionDigits: 0 }).format(valor);
  return (
    <Input
      {...props}
      inputMode="numeric"
      prefix="$"
      suffix={moneda}
      value={texto}
      onChange={(e) => {
        const digitos = e.target.value.replace(/\D/g, "").slice(0, 13);
        alCambiar(digitos ? Number(digitos) : null);
      }}
    />
  );
}
