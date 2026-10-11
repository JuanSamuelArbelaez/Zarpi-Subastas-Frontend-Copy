import clsx from "clsx";
import {
  ArrowRight, BadgeCheck, Building2, ChevronDown, Gavel, HandCoins, Hourglass, ImagePlus, LogIn,
  MessagesSquare, Moon, PackageOpen, Radio, Search, ShieldCheck, Sun, Tag, Timer, Trophy, UserRound,
} from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";

import { TarjetaSubasta } from "../components/subasta";
import { Button, Logo, Vacio } from "../components/ui";
import { api } from "../lib/api";
import { useTema } from "../lib/tema";
import type { Estadisticas, SubastaResumen } from "../lib/types";

// Landing pública de Zarpi Subastas: misma estructura y lenguaje visual que la
// landing de Zarpi (ImportacionesQ8), pero en una sola página con anclas.

const RUTA_LOGIN = "/entrar";
const RUTA_REGISTRO = "/registro";
const RUTA_SUBASTAS = "/subastas";
const RUTA_REGISTRO_EMPRESA = `${RUTA_REGISTRO}?rol=subastador`;

const SECCIONES = [
  { id: "inicio", label: "Inicio" },
  { id: "subastas", label: "Subastas" },
  { id: "como-funciona", label: "Cómo funciona" },
  { id: "empresas", label: "Para empresas" },
  { id: "preguntas", label: "Preguntas" },
] as const;

type IdSeccion = (typeof SECCIONES)[number]["id"];

const VISUALES = [
  { src: "/brand/container-1.jpg", alt: "Contenedores con mercancía en patio", label: "Lotes completos, al mejor postor." },
  { src: "/brand/shipping-1.jpg", alt: "Mercancía lista para despacho", label: "Inventario que vuelve a moverse." },
  { src: "/brand/container-2.jpg", alt: "Contenedores apilados en puerto", label: "Puja. Gana. Zarpi it." },
  { src: "/brand/shipping-2.jpg", alt: "Carga en tránsito", label: "Mercancía represada, nuevas oportunidades." },
  { src: "/brand/container-3.jpg", alt: "Operación de contenedores", label: "Precios que pone el mercado." },
  { src: "/brand/shipping-3.png", alt: "Despacho de mercancía", label: "De la bodega a tu negocio." },
  { src: "/brand/container-4.png", alt: "Contenedores de importación", label: "Subastas en vivo y por tiempo." },
  { src: "/brand/shipping-4.png", alt: "Logística de entrega", label: "Coordina la entrega por chat." },
  { src: "/brand/container-5.png", alt: "Bodega de mayorista", label: "Directo de mayoristas e importadores." },
  { src: "/brand/shipping-5.png", alt: "Envío de lotes", label: "Tu próxima oportunidad está en subasta." },
];

const BENEFICIOS = [
  { icono: HandCoins, titulo: "Pujas sin pagar al momento", texto: "Pujar no te cobra nada. Solo si ganas el lote acuerdas el pago con la empresa." },
  { icono: BadgeCheck, titulo: "Empresas identificadas", texto: "Cada empresa subastadora se registra con su razón social y NIT antes de publicar lotes." },
  { icono: Radio, titulo: "En vivo y por tiempo", texto: "Puja en subastas con hora de cierre o síguelas en vivo mientras la empresa las martilla." },
  { icono: MessagesSquare, titulo: "Chat en vivo con la empresa", texto: "Pregunta en la sala pública de cada subasta y, si ganas, coordina pago y entrega por chat." },
];

const PASOS = [
  { n: "01", titulo: "Explora", texto: "Revisa los lotes con fotos, descripción, cantidad, ubicación y precio inicial." },
  { n: "02", titulo: "Puja", texto: "Ofrece al menos la puja mínima. Te avisamos si alguien te supera." },
  { n: "03", titulo: "Gana", texto: "Si tu puja es la más alta al cierre, el lote es tuyo." },
  { n: "04", titulo: "Coordina", texto: "Acuerda el pago y la entrega directamente con la empresa en el chat." },
];

const FUNCIONES_EMPRESA = [
  { icono: ImagePlus, titulo: "Sube fotos y descripción", texto: "Publica cada lote con imágenes, cantidad, categoría y ubicación." },
  { icono: Tag, titulo: "Define tu precio inicial", texto: "Fija desde dónde arranca la puja y, si quieres, un precio de reserva secreto." },
  { icono: Timer, titulo: "Por tiempo o en vivo", texto: "Deja que cierre sola a la hora pactada o ábrela y martíllala tú mismo." },
  { icono: MessagesSquare, titulo: "Cierra y chatea con el ganador", texto: "Al adjudicar, coordinas pago y entrega con el comprador por el chat integrado." },
];

const REGLAS = [
  { icono: Trophy, texto: "La puja más alta al cierre gana el lote." },
  { icono: Hourglass, texto: "Una puja en los últimos 2 minutos extiende el cierre 2 minutos más." },
  { icono: ShieldCheck, texto: "Precio de reserva opcional y secreto: si no se alcanza, el lote no se adjudica." },
  { icono: HandCoins, texto: "Nadie paga al pujar: el pago se acuerda con la empresa al ganar." },
];

const PREGUNTAS = [
  { q: "¿Tengo que pagar al pujar?", a: "No. Pujar no implica ningún pago dentro de la plataforma. Solo si tu puja es la más alta cuando la subasta cierra ganas el lote, y ahí acuerdas el pago directamente con la empresa." },
  { q: "¿Qué pasa si gano?", a: "Te notificamos y se habilita el chat con la empresa subastadora para que coordinen el pago y la entrega de la mercancía." },
  { q: "¿Qué es una subasta en vivo?", a: "Es una subasta que la empresa abre en el momento que elige y cierra manualmente, como un martillo. Mientras está abierta puedes pujar en tiempo real y conversar en la sala de chat pública de la subasta." },
  { q: "¿Qué es el precio de reserva?", a: "Es un precio mínimo secreto que la empresa puede definir. Si al cierre la puja más alta no lo alcanza, el lote queda desierto y no se adjudica. Verás si la reserva ya se alcanzó, pero no su valor." },
  { q: "¿Por qué se extendió el cierre?", a: "Para evitar pujas de último segundo: si alguien puja en los últimos 2 minutos de una subasta por tiempo, el cierre se corre para que queden 2 minutos desde esa puja. Así todos tienen oportunidad de responder." },
  { q: "¿Cuánto cuesta?", a: "Registrarte en Zarpi Subastas es gratis, tanto si vas a pujar como si eres una empresa que quiere subastar su mercancía." },
];

/** Padding lateral de las secciones: más angosto en móvil para que quepa a 360px. */
const CONTENEDOR = "px-4 sm:px-6";

function irA(id: IdSeccion) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

/** Marca como activa la sección que ocupa la franja central de la pantalla. */
function useSeccionActiva(): IdSeccion {
  const [activa, setActiva] = useState<IdSeccion>("inicio");
  useEffect(() => {
    const observador = new IntersectionObserver(
      (entradas) => {
        const visible = entradas.find((e) => e.isIntersecting);
        if (visible) setActiva(visible.target.id as IdSeccion);
      },
      { rootMargin: "-45% 0px -50% 0px" },
    );
    SECCIONES.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observador.observe(el);
    });
    return () => observador.disconnect();
  }, []);
  return activa;
}

function Encabezado({ etiqueta, titulo, texto }: { etiqueta?: string; titulo: string; texto?: string }) {
  return (
    <div className="text-center mb-12">
      {etiqueta && <p className="text-xs uppercase tracking-[0.18em] text-primary dark:text-accent font-semibold mb-3">{etiqueta}</p>}
      <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">{titulo}</h2>
      {texto && <p className="text-muted-foreground mt-2 max-w-2xl mx-auto">{texto}</p>}
    </div>
  );
}

function IconoMarca({ children }: { children: ReactNode }) {
  return (
    <div className="landing-icon w-12 h-12 rounded-xl flex items-center justify-center border bg-primary/10 border-primary/20 text-primary dark:bg-[#EDF953]/15 dark:border-[#EDF953]/30 dark:text-[#EDF953] flex-shrink-0">
      {children}
    </div>
  );
}

function Navegacion({ activa, alEntrar, alRegistrar }: { activa: IdSeccion; alEntrar: () => void; alRegistrar: () => void }) {
  const { oscuro, alternar } = useTema();
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/85 backdrop-blur-md border-b border-border">
      <div className={clsx("max-w-7xl mx-auto h-16 flex items-center justify-between gap-3", CONTENEDOR)}>
        <button onClick={() => irA("inicio")} aria-label="Ir al inicio" className="flex-shrink-0">
          <Logo />
        </button>
        <div className="hidden lg:flex items-center gap-1">
          {SECCIONES.map((s) => (
            <button
              key={s.id}
              onClick={() => irA(s.id)}
              className={clsx(
                "px-3 py-1.5 rounded-full text-sm font-medium transition-colors",
                activa === s.id
                  ? "bg-primary text-white dark:bg-accent dark:text-accent-foreground"
                  : "text-muted-foreground hover:bg-foreground/15 dark:hover:bg-white/15 dark:hover:text-white",
              )}
            >
              {s.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => alternar(e)}
            title={oscuro ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
            aria-label={oscuro ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-primary hover:text-primary-foreground dark:hover:bg-accent dark:hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
          >
            {oscuro ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
          {/* En pantallas angostas no caben los dos botones junto al logo: queda "Entrar" y el registro vive en el hero. */}
          <Button variant="primary" size="sm" onClick={alEntrar} className="sm:hidden dark:bg-accent dark:text-accent-foreground dark:hover:bg-accent/80">
            Entrar
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={alEntrar}
            className="hidden sm:inline-flex hover:bg-primary hover:text-white hover:border-primary dark:hover:bg-accent dark:hover:text-accent-foreground dark:hover:border-accent"
          >
            Iniciar sesión
          </Button>
          <Button variant="primary" size="sm" onClick={alRegistrar} className="hidden sm:inline-flex hover:bg-primary/80 dark:bg-accent dark:text-accent-foreground dark:hover:bg-accent/80">
            Registrarse
          </Button>
        </div>
      </div>
    </nav>
  );
}

function Hero({ alVerSubastas, alRegistrar }: { alVerSubastas: () => void; alRegistrar: () => void }) {
  return (
    // En modo oscuro `bg-foreground` sería claro; se fuerza el fondo oscuro para que el hero se vea igual en ambos temas.
    <section id="inicio" className={clsx("scroll-mt-16 pt-32 pb-20 bg-foreground text-background dark:bg-[#0F0F0F] dark:text-white relative overflow-hidden", CONTENEDOR)}>
      <div className="absolute inset-0 bg-primary/25 pointer-events-none z-0" />
      <div className="zarpi-blob zarpi-blob-violet absolute -top-24 -left-24 z-0 pointer-events-none" />
      <div className="zarpi-blob zarpi-blob-acid absolute top-20 -right-20 z-0 pointer-events-none" />
      <div className="zarpi-blob zarpi-blob-neutral absolute -bottom-36 left-1/3 z-0 pointer-events-none" />

      <div className="landing-hero-content relative z-10 max-w-5xl mx-auto text-center">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-accent text-accent-foreground rounded-full text-xs font-semibold mb-6">
          <Gavel className="w-3.5 h-3.5" />Subastas de mercancía represada
        </span>
        <h1 className="text-4xl sm:text-6xl font-bold tracking-tight leading-tight mb-5">
          Mercancía al mejor postor,<br />
          <span className="text-accent">más cerca.</span>
        </h1>
        <p className="text-lg text-background/75 dark:text-white/75 max-w-2xl mx-auto leading-relaxed mb-8">
          Mayoristas, distribuidores e importadores subastan su inventario detenido. Tú pujas sin pagar al momento, ganas el lote y coordinas la entrega con la empresa.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button variant="accent" size="lg" icon={<Search className="w-4 h-4" />} onClick={alVerSubastas} className="px-8">
            Ver subastas
          </Button>
          <Button variant="accent" size="lg" icon={<UserRound className="w-4 h-4" />} onClick={alRegistrar} className="px-8">
            Crear cuenta gratis
          </Button>
        </div>
        <p className="mt-8 text-xs uppercase tracking-[0.18em] font-bold text-accent">Puja. Gana. Zarpi it.</p>
      </div>
    </section>
  );
}

function CarruselMarca() {
  return (
    <section className={clsx("relative py-10 bg-background overflow-hidden", CONTENEDOR)}>
      <div className="absolute left-0 top-0 bottom-0 w-12 sm:w-20 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-12 sm:w-20 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />

      <div className="relative z-0 overflow-hidden">
        {/* La lista va duplicada y cada tarjeta lleva su margen (no `gap`) para que el -50% de la animación encaje exacto. */}
        <div className="flex w-max animate-marquee hover:[animation-play-state:paused]">
          {[...VISUALES, ...VISUALES].map((v, i) => (
            <figure
              key={`${v.src}-${i}`}
              aria-hidden={i >= VISUALES.length}
              className="group relative w-64 md:w-80 mr-4 shrink-0 overflow-hidden rounded-2xl border border-border bg-card aspect-[4/3]"
            >
              <img src={v.src} alt={i >= VISUALES.length ? "" : v.alt} loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.02]" />
              <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/35 to-transparent px-3 pb-3 pt-8 text-xs font-semibold text-white">
                {v.label}
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}

function FranjaEstadisticas() {
  const [datos, setDatos] = useState<Estadisticas | null>(null);

  useEffect(() => {
    let vigente = true;
    api.estadisticas().then((e) => vigente && setDatos(e)).catch(() => { /* se queda en "—" */ });
    return () => { vigente = false; };
  }, []);

  const cifras: { valor: number | undefined; label: string }[] = [
    { valor: datos?.subastas_activas, label: "Subastas activas" },
    { valor: datos?.en_vivo_ahora, label: "En vivo ahora" },
    { valor: datos?.lotes_adjudicados, label: "Lotes adjudicados" },
    { valor: datos?.empresas, label: "Empresas subastadoras" },
  ];

  return (
    <section className="py-12 bg-card border-y border-border relative overflow-hidden">
      <div className={clsx("max-w-7xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-8 relative z-10", CONTENEDOR)}>
        {cifras.map((c) => (
          <div key={c.label} className="text-center">
            <p className="text-3xl font-bold text-primary dark:text-accent tabular-nums">{c.valor === undefined ? "—" : c.valor.toLocaleString("es-CO")}</p>
            <p className="text-sm text-muted-foreground mt-1">{c.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function SubastasEnCurso({ alVerTodas, alRegistrarEmpresa }: { alVerTodas: () => void; alRegistrarEmpresa: () => void }) {
  // null = cargando
  const [subastas, setSubastas] = useState<SubastaResumen[] | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let vigente = true;
    api.subastas({ estado: "vigentes", limite: 6 })
      .then((lista) => vigente && setSubastas(lista))
      .catch(() => { if (vigente) { setError(true); setSubastas([]); } });
    return () => { vigente = false; };
  }, []);

  return (
    <section id="subastas" className={clsx("scroll-mt-16 py-20 bg-background relative overflow-hidden", CONTENEDOR)}>
      <div className="zarpi-blob zarpi-blob-violet absolute right-0 top-1/4 pointer-events-none opacity-40 scale-110" />
      <div className="zarpi-blob zarpi-blob-acid absolute -left-16 bottom-0 pointer-events-none opacity-30 scale-90" />

      <div className="max-w-7xl mx-auto relative z-10">
        <Encabezado etiqueta="Subastas" titulo="Subastas en curso" texto="Lotes abiertos y por abrir. Míralos sin cuenta; regístrate gratis cuando quieras pujar." />

        {subastas === null ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5" aria-busy="true" aria-label="Cargando subastas">
            {Array.from({ length: 3 }, (_, i) => (
              <div key={i} className="rounded-2xl border border-border bg-card overflow-hidden animate-pulse">
                <div className="aspect-[4/3] bg-muted" />
                <div className="p-4 space-y-2">
                  <div className="h-4 w-3/4 rounded bg-muted" />
                  <div className="h-3 w-1/2 rounded bg-muted" />
                </div>
              </div>
            ))}
          </div>
        ) : subastas.length === 0 ? (
          <div className="max-w-xl mx-auto">
            <Vacio
              icono={<PackageOpen className="w-6 h-6" />}
              titulo={error ? "No pudimos cargar las subastas" : "Aún no hay subastas abiertas"}
              texto={error
                ? "Intenta de nuevo en un momento o abre el catálogo completo."
                : "¿Tienes mercancía represada? Publica tu primer lote y sé de las primeras empresas en subastar."}
              accion={(
                <Button variant="primary" size="md" icon={<Building2 className="w-4 h-4" />} onClick={alRegistrarEmpresa} className="dark:bg-accent dark:text-accent-foreground dark:hover:bg-accent/80">
                  Registrar mi empresa
                </Button>
              )}
            />
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {subastas.map((s) => (
              <TarjetaSubasta key={s.id} subasta={s} href={`/subastas/${s.id}`} />
            ))}
          </div>
        )}

        <div className="text-center mt-10">
          <Button
            variant="primary"
            size="md"
            icon={<Gavel className="w-4 h-4" />}
            iconRight={<ArrowRight className="w-4 h-4" />}
            onClick={alVerTodas}
            className="hover:bg-primary/80 dark:bg-accent dark:text-accent-foreground dark:hover:bg-accent/80"
          >
            Ver todas las subastas
          </Button>
        </div>
      </div>
    </section>
  );
}

function Beneficios() {
  return (
    <section className={clsx("py-20 bg-muted relative overflow-hidden", CONTENEDOR)}>
      <div className="zarpi-blob zarpi-blob-acid absolute -right-16 top-10 pointer-events-none opacity-30 scale-90" />
      <div className="zarpi-blob zarpi-blob-violet absolute -left-20 bottom-10 pointer-events-none opacity-25 scale-75" />

      <div className="max-w-7xl mx-auto relative z-10">
        <Encabezado titulo="Puja con tranquilidad" texto="Una forma clara de comprar mercancía de empresas a precio de subasta." />
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {BENEFICIOS.map(({ icono: Icono, titulo, texto }, i) => (
            <div key={titulo} className="landing-reveal bg-card/80 backdrop-blur-sm border border-border rounded-2xl p-6 hover:shadow-md transition-shadow" style={{ animationDelay: `${i * 90}ms` }}>
              <div className="mb-4"><IconoMarca><Icono className="w-6 h-6 text-primary" /></IconoMarca></div>
              <h3 className="font-semibold text-sm mb-2">{titulo}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">{texto}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ComoFunciona() {
  return (
    <section id="como-funciona" className={clsx("scroll-mt-16 py-20 bg-background relative overflow-hidden", CONTENEDOR)}>
      <div className="max-w-5xl mx-auto relative z-10">
        <Encabezado titulo="¿Cómo funciona?" texto="En cuatro pasos, desde que ves el lote hasta que lo recibes." />
        <div className="relative">
          <div className="hidden lg:block absolute top-7 left-[12.5%] right-[12.5%] h-0.5 bg-border z-0" />
          <ol className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 sm:gap-8">
            {PASOS.map((p) => (
              <li key={p.n} className="flex flex-col items-center text-center">
                <div className="w-14 h-14 rounded-2xl bg-accent border border-accent flex items-center justify-center mb-4 shadow-sm relative z-10">
                  <span className="text-lg font-bold text-accent-foreground">{p.n}</span>
                </div>
                <h3 className="font-semibold text-sm mb-1">{p.titulo}</h3>
                <p className="text-xs text-muted-foreground max-w-[220px]">{p.texto}</p>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}

function ParaEmpresas({ alRegistrarEmpresa }: { alRegistrarEmpresa: () => void }) {
  return (
    <section id="empresas" className={clsx("scroll-mt-16 py-20 bg-muted relative overflow-hidden", CONTENEDOR)}>
      <div className="zarpi-blob zarpi-blob-violet absolute -right-24 bottom-10 pointer-events-none opacity-35 scale-90" />
      <div className="zarpi-blob zarpi-blob-acid absolute -left-20 top-10 pointer-events-none opacity-30 scale-75" />

      <div className="max-w-6xl mx-auto relative z-10 grid lg:grid-cols-2 gap-10 items-center">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-primary dark:text-accent font-semibold mb-3">Para empresas</p>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-3">Tu mercancía represada, otra vez en movimiento.</h2>
          <p className="text-muted-foreground leading-relaxed mb-8">
            Si eres mayorista, distribuidor o importador y tienes inventario detenido, súbelo a subasta y deja que los compradores pongan el precio.
          </p>
          <ul className="space-y-5 mb-8">
            {FUNCIONES_EMPRESA.map(({ icono: Icono, titulo, texto }) => (
              <li key={titulo} className="flex items-start gap-4">
                <IconoMarca><Icono className="w-5 h-5 text-primary" /></IconoMarca>
                <div>
                  <h3 className="font-semibold text-sm">{titulo}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed mt-1">{texto}</p>
                </div>
              </li>
            ))}
          </ul>
          <Button
            variant="primary"
            size="lg"
            icon={<Building2 className="w-4 h-4" />}
            onClick={alRegistrarEmpresa}
            className="px-8 w-full sm:w-auto hover:bg-primary/80 dark:bg-accent dark:text-accent-foreground dark:hover:bg-accent/80"
          >
            Registrar mi empresa
          </Button>
        </div>

        <div className="relative overflow-hidden rounded-3xl border border-border bg-[#0F0F0F] text-white p-6 sm:p-8 landing-glow">
          <img src="/brand/fondo-1.png" alt="" aria-hidden="true" className="absolute inset-0 h-full w-full object-cover opacity-70" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/50 to-black/20" />
          <div className="relative">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-accent text-accent-foreground rounded-full text-xs font-semibold mb-5">
              <Gavel className="w-3.5 h-3.5" />Reglas claras para todos
            </span>
            <h3 className="text-xl font-bold mb-6">Así se juega cada subasta</h3>
            <ul className="space-y-4">
              {REGLAS.map(({ icono: Icono, texto }) => (
                <li key={texto} className="flex items-start gap-3">
                  <span className="w-8 h-8 rounded-lg bg-accent/15 border border-accent/40 text-accent flex items-center justify-center flex-shrink-0">
                    <Icono className="w-4 h-4" />
                  </span>
                  <p className="text-sm text-white/85 leading-relaxed pt-1">{texto}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

function PreguntasFrecuentes() {
  const [abierta, setAbierta] = useState<number | null>(null);
  return (
    <section id="preguntas" className={clsx("scroll-mt-16 py-20 bg-background relative overflow-hidden", CONTENEDOR)}>
      <div className="hidden dark:block zarpi-blob zarpi-blob-acid absolute right-10 top-1/3 pointer-events-none opacity-25 scale-90" />
      <div className="block dark:hidden zarpi-blob zarpi-blob-violet absolute left-10 bottom-10 pointer-events-none opacity-25 scale-90" />

      <div className="max-w-3xl mx-auto relative z-10">
        <Encabezado titulo="Preguntas frecuentes" />
        <div className="space-y-3">
          {PREGUNTAS.map((f, i) => {
            const abiertaEsta = abierta === i;
            return (
              <div key={f.q} className="border border-border rounded-xl overflow-hidden bg-card backdrop-blur-sm">
                <button
                  onClick={() => setAbierta(abiertaEsta ? null : i)}
                  aria-expanded={abiertaEsta}
                  aria-controls={`faq-${i}`}
                  className="group w-full flex items-center justify-between gap-3 px-5 py-4 text-left hover:bg-muted/50 transition-colors"
                >
                  <span className="font-medium text-sm">{f.q}</span>
                  <span className="w-7 h-7 rounded-full border border-border flex items-center justify-center flex-shrink-0 transition-colors duration-200 group-hover:bg-primary group-hover:border-primary dark:group-hover:bg-accent dark:group-hover:border-accent">
                    <ChevronDown className={clsx(
                      "w-4 h-4 text-muted-foreground transition-all duration-200 group-hover:text-white dark:group-hover:text-accent-foreground",
                      abiertaEsta && "rotate-180",
                    )} />
                  </span>
                </button>
                {abiertaEsta && (
                  <div id={`faq-${i}`} className="px-5 pb-4">
                    <p className="text-sm text-muted-foreground leading-relaxed">{f.a}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function BannerFinal({ alEntrar, alRegistrar }: { alEntrar: () => void; alRegistrar: () => void }) {
  return (
    <section className={clsx("py-16 bg-primary/60 relative overflow-hidden", CONTENEDOR)}>
      <div className="zarpi-blob zarpi-blob-violet absolute right-20 top-1/3 pointer-events-none opacity-25 scale-80" />
      <div className="zarpi-blob zarpi-blob-violet absolute left-15 bottom-15 pointer-events-none opacity-25 scale-80 -rotate-[90deg]" />
      <div className="max-w-3xl mx-auto text-center text-primary-foreground relative z-10">
        <h2 className="text-2xl font-bold mb-3">Tu próximo lote está en subasta</h2>
        <p className="text-primary-foreground/75 mb-7 leading-relaxed">Crea tu cuenta gratis, puja por mercancía de empresas y gana al mejor precio.</p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button variant="secondary" size="lg" icon={<UserRound className="w-4 h-4" />} onClick={alRegistrar} className="px-8 text-accent-foreground">
            Crear cuenta gratis
          </Button>
          <Button variant="secondary" size="lg" icon={<LogIn className="w-4 h-4" />} onClick={alEntrar} className="px-8 text-accent-foreground">
            Iniciar sesión
          </Button>
        </div>
      </div>
    </section>
  );
}

function PiePagina({ alEntrar, alRegistrarEmpresa }: { alEntrar: () => void; alRegistrarEmpresa: () => void }) {
  return (
    <footer className={clsx("bg-[#0F0F0F] text-white py-10 relative overflow-hidden", CONTENEDOR)}>
      <div className="zarpi-blob zarpi-blob-neutral absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none opacity-15 scale-125" />
      <div className="max-w-7xl mx-auto relative z-10">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div>
            <div className="mb-2"><Logo claro /></div>
            <p className="text-xs text-white/50">Mercancía al mejor postor, más cerca.</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 text-xs text-white/70">
            <button onClick={() => irA("como-funciona")} className="hover:text-accent transition-colors text-left">Cómo funciona</button>
            <button onClick={alRegistrarEmpresa} className="hover:text-accent transition-colors text-left">Registrar mi empresa</button>
            <button onClick={alEntrar} className="hover:text-accent transition-colors text-left">Iniciar sesión</button>
          </div>
        </div>
        <div className="border-t border-white/10 mt-8 pt-6 text-xs text-white/40 text-center">
          © 2026 Zarpi Subastas. Parte de la familia Zarpi.
        </div>
      </div>
    </footer>
  );
}

export default function Landing() {
  const navegar = useNavigate();
  const activa = useSeccionActiva();

  const alEntrar = () => navegar(RUTA_LOGIN);
  const alRegistrar = () => navegar(RUTA_REGISTRO);
  const alRegistrarEmpresa = () => navegar(RUTA_REGISTRO_EMPRESA);
  const alVerSubastas = () => navegar(RUTA_SUBASTAS);

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      <Navegacion activa={activa} alEntrar={alEntrar} alRegistrar={alRegistrar} />
      <Hero alVerSubastas={alVerSubastas} alRegistrar={alRegistrar} />
      <CarruselMarca />
      <FranjaEstadisticas />
      <SubastasEnCurso alVerTodas={alVerSubastas} alRegistrarEmpresa={alRegistrarEmpresa} />
      <Beneficios />
      <ComoFunciona />
      <ParaEmpresas alRegistrarEmpresa={alRegistrarEmpresa} />
      <PreguntasFrecuentes />
      <BannerFinal alEntrar={alEntrar} alRegistrar={alRegistrar} />
      <PiePagina alEntrar={alEntrar} alRegistrarEmpresa={alRegistrarEmpresa} />
    </div>
  );
}
