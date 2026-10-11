import clsx from "clsx";
import {
  ArrowLeft, Ban, Building2, CheckCircle2, Gavel, Hammer, ImageOff, Info, Lock, MapPin, MessageCircle, Package,
  Play, ShieldCheck, Tag, Trophy, Users,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";

import { useEnVivo, useEventos } from "../app/enVivo";
import { useSesion } from "../app/sesion";
import { ModalAcceso, type MotivoAcceso } from "../components/acceso";
import { VentanaChat } from "../components/chat";
import { CuentaRegresiva, EtiquetaEstado, EtiquetaModalidad } from "../components/subasta";
import { Button, CampoMonto, Card, Cargando, Celebracion, Modal, Pagina, Pildora, Vacio } from "../components/ui";
import { api, urlMedia } from "../lib/api";
import { dinero, dineroCorto, duracionLegible, haceCuanto } from "../lib/formato";
import { useRutaBase } from "../lib/rutas";
import type { Mensaje, Puja, SubastaDetalle } from "../lib/types";

export default function DetalleSubasta() {
  const { id = "" } = useParams();
  const { usuario } = useSesion();
  const { seguirSubasta } = useEnVivo();
  const base = useRutaBase();
  const [pedirAcceso, setPedirAcceso] = useState<MotivoAcceso | null>(null);
  const [subasta, setSubasta] = useState<SubastaDetalle | null>(null);
  const [pujas, setPujas] = useState<Puja[]>([]);
  const [sala, setSala] = useState<Mensaje[]>([]);
  const [error, setError] = useState("");

  const cargar = useCallback(async () => {
    try {
      const [detalle, historial, mensajes] = await Promise.all([api.subasta(id), api.pujas(id), api.sala(id)]);
      setSubasta(detalle);
      setPujas(historial);
      setSala(mensajes);
    } catch (e) {
      setError((e as Error).message);
    }
  }, [id]);

  useEffect(() => { cargar(); }, [cargar]);
  useEffect(() => seguirSubasta(id), [id, seguirSubasta]);

  useEventos((evento) => {
    if (evento.tipo === "puja" && evento.subasta_id === id) {
      setSubasta((s) => {
        if (!s) return s;
        // El evento no dice quién pujó: si el monto es mi puja más alta, soy yo.
        const soyYo = s.mi_puja_maxima !== null && s.mi_puja_maxima === evento.puja.monto;
        return {
          ...s,
          precio_actual: evento.precio_actual,
          minimo_siguiente: evento.minimo_siguiente,
          total_pujas: evento.total_pujas,
          fecha_fin: evento.fecha_fin,
          reserva_alcanzada: s.reserva_alcanzada || (s.precio_reserva !== null && evento.precio_actual >= s.precio_reserva),
          mi_situacion: s.mi_puja_maxima === null ? s.mi_situacion : soyYo ? "ganando" : "superado",
        };
      });
      setPujas((lista) => lista.some((p) => p.id === evento.puja.id)
        ? lista
        : [{ id: evento.puja.id, monto: evento.puja.monto, fecha: evento.puja.fecha, alias: evento.puja.alias, es_mia: false, nombre: null }, ...lista]);
      if (evento.extendida) toast.info("Se extendió el cierre", { description: "Llegó una puja en los últimos minutos." });
      // La empresa ve los nombres de los postores: eso solo lo trae el historial completo.
      if (subasta?.es_mia) api.pujas(id).then(setPujas).catch(() => {});
    }
    if (evento.tipo === "estado" && evento.subasta_id === id) {
      if (evento.subasta.estado === "finalizada") cargar();
      else setSubasta((s) => (s ? { ...s, ...evento.subasta } : s));
    }
    if (evento.tipo === "mensaje_sala" && evento.mensaje.subasta_id === id) {
      setSala((lista) => (lista.some((m) => m.id === evento.mensaje.id) ? lista : [...lista, evento.mensaje]));
    }
  });

  if (error) return <Pagina><Vacio icono={<Gavel className="w-6 h-6" />} titulo="No encontramos esta subasta" texto={error} accion={<Link to={`${base}/subastas`}><Button variant="secondary">Volver a subastas</Button></Link>} /></Pagina>;
  if (!subasta) return <Cargando />;

  const salaCerrada = subasta.estado === "finalizada" || subasta.estado === "cancelada";

  async function escribirEnSala(texto: string) {
    const mensaje = await api.escribirEnSala(id, texto);
    setSala((lista) => (lista.some((m) => m.id === mensaje.id) ? lista : [...lista, mensaje]));
  }

  return (
    <Pagina>
      <Link to={subasta.es_mia ? "/app/mis-subastas" : `${base}/subastas`} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4">
        <ArrowLeft className="w-4 h-4" />{subasta.es_mia ? "Mis subastas" : "Subastas"}
      </Link>

      <div className="grid gap-6 lg:grid-cols-12">
        <div className="lg:col-span-7 space-y-6 min-w-0">
          <div>
            <div className="flex flex-wrap gap-1.5 mb-2">
              <EtiquetaEstado subasta={subasta} />
              <EtiquetaModalidad modalidad={subasta.modalidad} />
              <Pildora className="bg-foreground/5 text-foreground"><Tag className="w-3 h-3" />{subasta.categoria}</Pildora>
            </div>
            <h1 className="text-2xl font-bold tracking-tight leading-tight">{subasta.titulo}</h1>
            <p className="text-sm text-muted-foreground mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
              <span className="inline-flex items-center gap-1"><Building2 className="w-3.5 h-3.5" />{subasta.subastador.empresa_nombre}</span>
              {subasta.ubicacion && <span className="inline-flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{subasta.ubicacion}</span>}
              {subasta.cantidad && <span className="inline-flex items-center gap-1"><Package className="w-3.5 h-3.5" />{subasta.cantidad}</span>}
            </p>
          </div>

          <Galeria imagenes={subasta.imagenes} titulo={subasta.titulo} />

          <Card>
            <h2 className="text-sm font-semibold mb-2">Descripción del lote</h2>
            <p className="text-sm text-muted-foreground whitespace-pre-line leading-relaxed">{subasta.descripcion}</p>
            <dl className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-5 pt-5 border-t border-border text-sm">
              <Dato titulo="Precio inicial" valor={dinero(subasta.precio_inicial, subasta.moneda)} />
              <Dato titulo="Incremento mínimo" valor={dinero(subasta.incremento_minimo, subasta.moneda)} />
              <Dato titulo="Modalidad" valor={subasta.modalidad === "en_vivo" ? "En vivo" : `Por tiempo · ${duracionLegible(subasta.duracion_minutos ?? 0)}`} />
              <Dato titulo="Precio de reserva" valor={subasta.es_mia && subasta.precio_reserva ? dinero(subasta.precio_reserva, subasta.moneda) : subasta.tiene_reserva ? (subasta.reserva_alcanzada ? "Alcanzado" : "Aún no se alcanza") : "Sin reserva"} />
              {subasta.cantidad && <Dato titulo="Cantidad" valor={subasta.cantidad} />}
              {subasta.ubicacion && <Dato titulo="Ubicación" valor={subasta.ubicacion} />}
            </dl>
          </Card>

          <HistorialPujas pujas={pujas} subasta={subasta} />
        </div>

        <div className="lg:col-span-5 space-y-6">
          <div className="lg:sticky lg:top-6 space-y-6">
            <PanelPuja subasta={subasta} alPedirAcceso={setPedirAcceso} alCambiar={setSubasta} alPujar={(p) => setPujas((lista) => [p, ...lista.filter((x) => x.id !== p.id)])} recargar={cargar} />
            <Card padding="none" className="overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                <h2 className="text-sm font-semibold flex items-center gap-2"><Users className="w-4 h-4" />Sala de la subasta</h2>
                {!salaCerrada && <span className="inline-flex items-center gap-1.5 text-[11px] text-emerald-600 dark:text-emerald-400"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />Chat en vivo</span>}
              </div>
              <VentanaChat
                className="h-[360px]"
                mensajes={sala}
                miId={usuario?.id}
                alEnviar={escribirEnSala}
                alPedirAcceso={usuario ? undefined : () => setPedirAcceso("chatear")}
                aviso={salaCerrada ? "La sala se cerró al terminar la subasta." : usuario?.rol === "subastador" && !subasta.es_mia ? "Solo la empresa dueña y los clientes escriben aquí." : undefined}
                placeholder="Pregunta algo a todos…"
              />
            </Card>
          </div>
        </div>
      </div>
      <ModalAcceso motivo={pedirAcceso} alCerrar={() => setPedirAcceso(null)} />
    </Pagina>
  );
}

function Dato({ titulo, valor }: { titulo: string; valor: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs text-muted-foreground">{titulo}</dt>
      <dd className="font-medium truncate">{valor}</dd>
    </div>
  );
}

function Galeria({ imagenes, titulo }: { imagenes: SubastaDetalle["imagenes"]; titulo: string }) {
  const [actual, setActual] = useState(0);
  const imagen = imagenes[actual] ?? imagenes[0];
  return (
    <div className="space-y-3">
      <div className="aspect-[4/3] rounded-2xl overflow-hidden bg-muted border border-border">
        {imagen
          ? <img src={urlMedia(imagen.url)} alt={titulo} className="w-full h-full object-contain bg-black/5 dark:bg-white/5" />
          : <div className="w-full h-full flex items-center justify-center text-muted-foreground"><ImageOff className="w-10 h-10" /></div>}
      </div>
      {imagenes.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {imagenes.map((img, i) => (
            <button
              key={img.id}
              onClick={() => setActual(i)}
              aria-label={`Ver foto ${i + 1}`}
              className={clsx("w-20 h-16 flex-shrink-0 rounded-lg overflow-hidden border-2 transition-colors", i === actual ? "border-primary dark:border-accent" : "border-transparent opacity-70 hover:opacity-100")}
            >
              <img src={urlMedia(img.url)} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function HistorialPujas({ pujas, subasta }: { pujas: Puja[]; subasta: SubastaDetalle }) {
  return (
    <Card padding="none">
      <div className="flex items-center justify-between px-5 py-3 border-b border-border">
        <h2 className="text-sm font-semibold flex items-center gap-2"><Gavel className="w-4 h-4" />Historial de pujas</h2>
        <span className="text-xs text-muted-foreground">{subasta.total_pujas} {subasta.total_pujas === 1 ? "puja" : "pujas"}</span>
      </div>
      {pujas.length === 0 ? (
        <p className="px-5 py-8 text-sm text-center text-muted-foreground">Aún no hay pujas. {subasta.estado === "activa" ? "¡La primera puede ser la tuya!" : ""}</p>
      ) : (
        <ul className="divide-y divide-border max-h-80 overflow-y-auto">
          {pujas.map((p, i) => (
            <li key={p.id} className={clsx("flex items-center justify-between gap-3 px-5 py-2.5 text-sm", i === 0 && "bg-accent/20 dark:bg-accent/10")}>
              <div className="min-w-0">
                <p className="font-medium truncate">
                  {p.es_mia ? "Tú" : p.alias}
                  {p.nombre && <span className="text-muted-foreground font-normal"> · {p.nombre}</span>}
                  {i === 0 && <Trophy className="inline w-3.5 h-3.5 ml-1.5 -mt-0.5 text-primary dark:text-accent" />}
                </p>
                <p className="text-xs text-muted-foreground">{haceCuanto(p.fecha)}</p>
              </div>
              <p className="font-semibold tabular-nums">{dinero(p.monto, subasta.moneda)}</p>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

function PanelPuja({ subasta, alPedirAcceso, alCambiar, alPujar, recargar }: {
  subasta: SubastaDetalle;
  alPedirAcceso: (motivo: MotivoAcceso) => void;
  alCambiar: (s: SubastaDetalle) => void;
  alPujar: (p: Puja) => void;
  recargar: () => Promise<void>;
}) {
  const { usuario } = useSesion();
  const navegar = useNavigate();
  const precio = subasta.precio_actual ?? subasta.precio_inicial;

  async function preguntar() {
    try {
      const conversacion = await api.abrirConversacion(subasta.id);
      navegar(`/app/mensajes/${conversacion.id}`);
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  return (
    <Card padding="lg" className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground">{subasta.precio_actual ? "Puja más alta" : "Precio inicial"}</p>
          <p className="text-3xl font-bold tracking-tight tabular-nums whitespace-nowrap">{dineroCorto(precio)} <span className="text-base font-medium text-muted-foreground">{subasta.moneda}</span></p>
          <p className="text-xs text-muted-foreground mt-1">{subasta.total_pujas} {subasta.total_pujas === 1 ? "puja" : "pujas"}{subasta.tiene_reserva && ` · ${subasta.reserva_alcanzada ? "reserva alcanzada" : "con precio de reserva"}`}</p>
        </div>
        <CuentaRegresiva subasta={subasta} grande className="sm:text-right" />
      </div>

      <Situacion subasta={subasta} />

      {subasta.es_mia ? (
        <ControlesEmpresa subasta={subasta} alCambiar={alCambiar} />
      ) : !usuario ? (
        <>
          {subasta.estado === "activa" && <FormularioPuja subasta={subasta} alCambiar={alCambiar} alPujar={alPujar} recargar={recargar} alPedirAcceso={() => alPedirAcceso("pujar")} />}
          {(subasta.estado === "activa" || subasta.estado === "proxima") && (
            <Button fullWidth variant="secondary" icon={<MessageCircle className="w-4 h-4" />} onClick={() => alPedirAcceso("preguntar")}>Preguntar a la empresa</Button>
          )}
        </>
      ) : usuario.rol === "cliente" ? (
        <>
          {subasta.estado === "activa" && <FormularioPuja subasta={subasta} alCambiar={alCambiar} alPujar={alPujar} recargar={recargar} />}
          {subasta.estado === "finalizada" && subasta.mi_situacion === "ganada" ? (
            <Button fullWidth size="lg" icon={<MessageCircle className="w-4 h-4" />} onClick={preguntar}>Coordinar pago y entrega</Button>
          ) : (
            <Button fullWidth variant="secondary" icon={<MessageCircle className="w-4 h-4" />} onClick={preguntar}>Preguntar a la empresa</Button>
          )}
        </>
      ) : (
        <p className="text-xs text-muted-foreground flex items-start gap-1.5"><Info className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />Las cuentas de empresa no pujan. Usa una cuenta de cliente para participar.</p>
      )}
    </Card>
  );
}

function Situacion({ subasta }: { subasta: SubastaDetalle }) {
  const { mi_situacion: situacion, estado, resultado, ganador } = subasta;
  if (estado === "proxima") {
    return (
      <Aviso tono="info" icono={<Info className="w-4 h-4" />}>
        {subasta.modalidad === "en_vivo" ? "La empresa abrirá el martillo a la hora anunciada. Quédate en esta página: las pujas se actualizan solas." : "La subasta todavía no abre. Podrás pujar cuando empiece."}
      </Aviso>
    );
  }
  if (estado === "cancelada") return <Aviso tono="neutro" icono={<Ban className="w-4 h-4" />}>La empresa canceló esta subasta.</Aviso>;
  if (situacion === "ganando") return <Aviso tono="exito" icono={<Trophy className="w-4 h-4" />}>Vas ganando con {dinero(subasta.mi_puja_maxima, subasta.moneda)}.</Aviso>;
  if (situacion === "superado") return <Aviso tono="alerta" icono={<Gavel className="w-4 h-4" />}>Te superaron. Tu puja más alta fue {dinero(subasta.mi_puja_maxima, subasta.moneda)}.</Aviso>;
  if (situacion === "ganada") return <Aviso tono="exito" icono={<Trophy className="w-4 h-4" />}>¡Ganaste este lote! Escríbele a la empresa para coordinar el pago y la entrega.</Aviso>;
  if (situacion === "perdida") return <Aviso tono="neutro" icono={<Gavel className="w-4 h-4" />}>Este lote se adjudicó a {ganador?.alias ?? "otro postor"}.</Aviso>;
  if (estado === "finalizada") {
    return resultado === "adjudicada"
      ? <Aviso tono="exito" icono={<CheckCircle2 className="w-4 h-4" />}>Adjudicada a {ganador?.nombre ? `${ganador.nombre} (${ganador.alias})` : ganador?.alias}.{ganador?.email && <><br />{ganador.email}{ganador.telefono && ` · ${ganador.telefono}`}</>}</Aviso>
      : <Aviso tono="neutro" icono={<Ban className="w-4 h-4" />}>La subasta cerró sin ganador{subasta.total_pujas > 0 ? ": no se alcanzó el precio de reserva." : ": no recibió pujas."}</Aviso>;
  }
  return null;
}

function Aviso({
  tono,
  icono,
  children,
}: {
  tono: "exito" | "alerta" | "info" | "neutro";
  icono: React.ReactNode;
  children: React.ReactNode;
}) {
  const tonos = {
    exito:
      "bg-emerald-50 text-emerald-800 border-emerald-200 dark:!bg-accent/20 dark:!text-accent dark:!border-accent/40",
    alerta:
      "bg-amber-50 text-amber-800 border-amber-200 dark:!bg-accent/20 dark:!text-accent dark:!border-accent/40",
    info:
      "bg-primary/5 text-foreground border-primary/20 dark:!bg-accent/20 dark:!text-accent dark:!border-accent/40",
    neutro:
      "bg-muted text-muted-foreground border-border dark:!bg-accent/20 dark:!text-accent dark:!border-accent/40",
  };

  return (
    <div
      className={clsx(
        "flex items-start gap-2 rounded-xl border px-3 py-2.5 text-sm transition-colors",
        tonos[tono]
      )}
    >
      <span className="mt-0.5 flex-shrink-0">{icono}</span>
      <div>{children}</div>
    </div>
  );
}

function FormularioPuja({ subasta, alCambiar, alPujar, recargar, alPedirAcceso }: {
  subasta: SubastaDetalle;
  /** Visitante sin sesión: al pujar se le pide entrar o registrarse. */
  alPedirAcceso?: () => void;
  alCambiar: (s: SubastaDetalle) => void;
  alPujar: (p: Puja) => void;
  recargar: () => Promise<void>;
}) {
  const [monto, setMonto] = useState<number | null>(subasta.minimo_siguiente);
  const [confirmar, setConfirmar] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [celebrando, setCelebrando] = useState(false);
  const vasGanando = subasta.mi_situacion === "ganando";

  // Si otra persona puja, la sugerencia sube con el nuevo mínimo.
  useEffect(() => {
    setMonto((m) => (m === null || m < subasta.minimo_siguiente ? subasta.minimo_siguiente : m));
  }, [subasta.minimo_siguiente]);

  const rapidos = [1, 2, 5].map((veces) => subasta.minimo_siguiente + subasta.incremento_minimo * (veces - 1));
  const valido = monto !== null && monto >= subasta.minimo_siguiente;

  async function pujar() {
    if (!valido || monto === null) return;
    setEnviando(true);
    try {
      const puja = await api.pujar(subasta.id, monto);
      alPujar(puja);
      alCambiar({
        ...subasta,
        precio_actual: puja.monto,
        minimo_siguiente: puja.monto + subasta.incremento_minimo,
        total_pujas: Math.max(subasta.total_pujas, subasta.total_pujas + 1),
        mi_puja_maxima: puja.monto,
        mi_situacion: "ganando",
      });
      setConfirmar(false);
      setCelebrando(true);
      window.setTimeout(() => setCelebrando(false), 2200);
      toast.success("¡Puja registrada!", { description: `Vas ganando con ${dinero(puja.monto, subasta.moneda)}.` });
      // El conteo y la hora de cierre exactos (por si se extendió) los da el servidor.
      recargar();
    } catch (e) {
      toast.error((e as Error).message);
      setConfirmar(false);
      recargar();
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="relative space-y-3">
      <Celebracion visible={celebrando} />
      <CampoMonto
        label="Tu puja"
        valor={monto}
        alCambiar={setMonto}
        moneda={subasta.moneda}
        hint={`Mínimo ${dinero(subasta.minimo_siguiente, subasta.moneda)}`}
        error={monto !== null && !valido ? `Debe ser al menos ${dinero(subasta.minimo_siguiente, subasta.moneda)}` : undefined}
        disabled={vasGanando}
      />
      <div className="grid grid-cols-3 gap-2">
        {rapidos.map((r) => (
          <button key={r} type="button" disabled={vasGanando} onClick={() => setMonto(r)} className={clsx("h-8 rounded-lg border text-xs font-medium tabular-nums transition-colors disabled:opacity-50", monto === r ? "border-primary bg-primary/10 text-primary dark:border-accent dark:bg-accent/15 dark:text-accent" : "border-border hover:bg-muted")}>
            {new Intl.NumberFormat("es-CO", { notation: "compact", maximumFractionDigits: 2 }).format(r)}
          </button>
        ))}
      </div>
      <Button fullWidth size="lg" icon={<Gavel className="w-4 h-4" />} disabled={!valido || vasGanando} onClick={() => (alPedirAcceso ? alPedirAcceso() : setConfirmar(true))}>
        {vasGanando ? "Vas ganando" : "Pujar"}
      </Button>
      <p className="text-xs text-muted-foreground flex items-start gap-1.5">
        <ShieldCheck className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />No pagas nada ahora. Si ganas, coordinas el pago y la entrega con la empresa.
      </p>

      <Modal abierto={confirmar} alCerrar={() => setConfirmar(false)} titulo="Confirma tu puja">
        <div className="space-y-4">
          <div className="rounded-xl bg-muted p-4 text-center">
            <p className="text-xs text-muted-foreground">Vas a pujar</p>
            <p className="text-2xl font-bold tabular-nums">{dinero(monto, subasta.moneda)}</p>
            <p className="text-xs text-muted-foreground mt-1 truncate">{subasta.titulo}</p>
          </div>
          <p className="text-sm text-muted-foreground">
            Una puja es un compromiso de compra: si al cierre es la más alta, el lote es tuyo por ese valor. No se cobra nada ahora.
          </p>
          <div className="flex gap-2 justify-end">
            <Button variant="ghost" onClick={() => setConfirmar(false)}>Cancelar</Button>
            <Button onClick={pujar} loading={enviando} icon={<Gavel className="w-4 h-4" />} autoFocus>Confirmar puja</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function ControlesEmpresa({ subasta, alCambiar }: { subasta: SubastaDetalle; alCambiar: (s: SubastaDetalle) => void }) {
  const [accion, setAccion] = useState<null | "iniciar" | "cerrar" | "cancelar">(null);
  const [enviando, setEnviando] = useState(false);

  async function ejecutar() {
    if (!accion) return;
    setEnviando(true);
    try {
      const metodo = { iniciar: api.iniciar, cerrar: api.cerrar, cancelar: api.cancelar }[accion];
      alCambiar(await metodo(subasta.id));
      toast.success({ iniciar: "¡Subasta en vivo abierta!", cerrar: "Subasta cerrada", cancelar: "Subasta cancelada" }[accion]);
      setAccion(null);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setEnviando(false);
    }
  }

  const textos = {
    iniciar: { titulo: "Abrir la subasta en vivo", cuerpo: "Desde ahora los clientes podrán pujar. Tú decides cuándo bajar el martillo.", boton: "Abrir martillo" },
    cerrar: { titulo: "Bajar el martillo", cuerpo: subasta.total_pujas > 0 ? `El lote se adjudicará a la puja más alta (${dinero(subasta.precio_actual, subasta.moneda)})${subasta.tiene_reserva && !subasta.reserva_alcanzada ? ", pero no alcanza tu precio de reserva y quedará desierta" : ""}. Esto no se puede deshacer.` : "Nadie ha pujado: la subasta quedará desierta. Esto no se puede deshacer.", boton: "Cerrar y adjudicar" },
    cancelar: { titulo: "Cancelar la subasta", cuerpo: "La subasta desaparecerá del listado. Solo se puede cancelar mientras no tenga pujas.", boton: "Cancelar subasta" },
  };

  const puedeCancelar = subasta.total_pujas === 0 && (subasta.estado === "activa" || subasta.estado === "proxima");
  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-muted-foreground flex items-center gap-1.5"><Lock className="w-3.5 h-3.5" />Controles de tu empresa</p>
      {subasta.modalidad === "en_vivo" && subasta.estado === "proxima" && (
        <Button fullWidth size="lg" icon={<Play className="w-4 h-4" />} onClick={() => setAccion("iniciar")}>Abrir subasta en vivo</Button>
      )}
      {subasta.modalidad === "en_vivo" && subasta.estado === "activa" && (
        <Button fullWidth size="lg" icon={<Hammer className="w-4 h-4" />} onClick={() => setAccion("cerrar")}>Bajar el martillo</Button>
      )}
      {subasta.modalidad === "tiempo" && subasta.estado === "activa" && (
        <p className="text-xs text-muted-foreground">Esta subasta cierra sola a la hora indicada. Si alguien puja en los últimos 2 minutos, el cierre se corre 2 minutos.</p>
      )}
      {puedeCancelar && <Button fullWidth variant="ghost" icon={<Ban className="w-4 h-4" />} onClick={() => setAccion("cancelar")}>Cancelar subasta</Button>}

      <Modal abierto={accion !== null} alCerrar={() => setAccion(null)} titulo={accion ? textos[accion].titulo : ""}>
        {accion && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">{textos[accion].cuerpo}</p>
            <div className="flex gap-2 justify-end">
              <Button variant="ghost" onClick={() => setAccion(null)}>Volver</Button>
              <Button variant={accion === "cancelar" ? "danger" : "primary"} loading={enviando} onClick={ejecutar}>{textos[accion].boton}</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
