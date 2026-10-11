import clsx from "clsx";
import { ArrowLeft, ArrowRight, ImagePlus, Loader2, Radio, Star, Timer, Trash2 } from "lucide-react";
import { useEffect, useRef, useState, type DragEvent, type FormEvent, type ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { useSesion } from "../app/sesion";
import { TarjetaSubasta } from "../components/subasta";
import { Button, CampoMonto, Card, Encabezado, Input, Pagina, Select, Textarea } from "../components/ui";
import { api, urlMedia } from "../lib/api";
import { dinero, duracionLegible } from "../lib/formato";
import type { SubastaResumen } from "../lib/types";

const MAX_IMAGENES = 10;
const MAX_MB = 8;
const TIPOS = ["image/jpeg", "image/png", "image/webp"];
const DURACIONES = [15, 30, 60, 180, 360, 720, 1440, 4320, 10080];

interface Foto { id: string; url: string }

/** Valor para <input type="datetime-local"> en la hora local del navegador. */
function aLocal(fecha: Date) {
  const desfase = fecha.getTimezoneOffset() * 60000;
  return new Date(fecha.getTime() - desfase).toISOString().slice(0, 16);
}

/** Un incremento redondo de ~5% del precio inicial: 1.000.000 → 50.000. */
function incrementoSugerido(precio: number) {
  const bruto = precio * 0.05;
  const magnitud = 10 ** Math.max(0, Math.floor(Math.log10(bruto || 1)) - 1);
  return Math.max(1, Math.round(bruto / magnitud) * magnitud);
}

export default function NuevaSubasta() {
  const { usuario } = useSesion();
  const navegar = useNavigate();
  const [categorias, setCategorias] = useState<string[]>([]);
  const [fotos, setFotos] = useState<Foto[]>([]);
  const [subiendo, setSubiendo] = useState(false);
  const [arrastrando, setArrastrando] = useState(false);
  const selector = useRef<HTMLInputElement>(null);

  const [titulo, setTitulo] = useState("");
  const [categoria, setCategoria] = useState("");
  const [cantidad, setCantidad] = useState("");
  const [ubicacion, setUbicacion] = useState(usuario?.ciudad ?? "");
  const [descripcion, setDescripcion] = useState("");
  const [precioInicial, setPrecioInicial] = useState<number | null>(null);
  const [incremento, setIncremento] = useState<number | null>(null);
  const [incrementoTocado, setIncrementoTocado] = useState(false);
  const [conReserva, setConReserva] = useState(false);
  const [reserva, setReserva] = useState<number | null>(null);
  const [modalidad, setModalidad] = useState<"tiempo" | "en_vivo">("tiempo");
  const [empiezaYa, setEmpiezaYa] = useState(true);
  const [inicio, setInicio] = useState(() => aLocal(new Date(Date.now() + 3600000)));
  const [duracion, setDuracion] = useState(1440);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => { api.categorias().then(setCategorias).catch(() => {}); }, []);

  // Mientras la empresa no toque el incremento, se sugiere uno según el precio.
  useEffect(() => {
    if (!incrementoTocado && precioInicial) setIncremento(incrementoSugerido(precioInicial));
  }, [precioInicial, incrementoTocado]);

  async function agregarFotos(archivos: FileList | File[]) {
    const lista = Array.from(archivos);
    const invalida = lista.find((a) => !TIPOS.includes(a.type));
    if (invalida) return toast.error(`«${invalida.name}» no es JPG, PNG o WEBP`);
    const pesada = lista.find((a) => a.size > MAX_MB * 1024 * 1024);
    if (pesada) return toast.error(`«${pesada.name}» pesa más de ${MAX_MB} MB`);
    if (fotos.length + lista.length > MAX_IMAGENES) return toast.error(`Máximo ${MAX_IMAGENES} fotos por subasta`);
    setSubiendo(true);
    try {
      const subidas = await api.subirImagenes(lista);
      setFotos((f) => [...f, ...subidas]);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSubiendo(false);
      if (selector.current) selector.current.value = "";
    }
  }

  function mover(indice: number, paso: -1 | 1) {
    setFotos((f) => {
      const copia = [...f];
      const destino = indice + paso;
      if (destino < 0 || destino >= copia.length) return f;
      [copia[indice], copia[destino]] = [copia[destino], copia[indice]];
      return copia;
    });
  }

  function alSoltar(e: DragEvent) {
    e.preventDefault();
    setArrastrando(false);
    if (e.dataTransfer.files.length) agregarFotos(e.dataTransfer.files);
  }

  async function publicar(e: FormEvent) {
    e.preventDefault();
    setError("");
    if (fotos.length === 0) return setError("Sube al menos una foto de la mercancía.");
    if (!precioInicial || !incremento) return setError("Define el precio inicial y el incremento mínimo.");
    if (conReserva && (!reserva || reserva < precioInicial)) return setError("El precio de reserva debe ser igual o mayor al precio inicial.");
    const programada = modalidad === "en_vivo" || !empiezaYa;
    if (programada && new Date(inicio).getTime() < Date.now() - 60000) return setError("La fecha de inicio ya pasó.");

    setEnviando(true);
    try {
      const subasta = await api.crearSubasta({
        titulo, descripcion, categoria,
        cantidad: cantidad || undefined,
        ubicacion: ubicacion || undefined,
        precio_inicial: precioInicial,
        incremento_minimo: incremento,
        precio_reserva: conReserva ? reserva : null,
        modalidad,
        fecha_inicio: programada ? new Date(inicio).toISOString() : null,
        duracion_minutos: modalidad === "tiempo" ? duracion : null,
        imagen_ids: fotos.map((f) => f.id),
      });
      toast.success(subasta.estado === "activa" ? "¡Tu subasta ya está recibiendo pujas!" : "Subasta publicada");
      navegar(`/app/subastas/${subasta.id}`);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setEnviando(false);
    }
  }

  const programadaPara = modalidad === "en_vivo" || !empiezaYa ? new Date(inicio) : new Date();
  const vistaPrevia: SubastaResumen = {
    id: "vista-previa",
    titulo: titulo || "Título de tu lote",
    categoria: categoria || "Categoría",
    cantidad: cantidad || null,
    ubicacion: ubicacion || null,
    moneda: "COP",
    precio_inicial: precioInicial ?? 0,
    precio_actual: null,
    minimo_siguiente: precioInicial ?? 0,
    total_pujas: 0,
    modalidad,
    estado: modalidad === "tiempo" && empiezaYa ? "activa" : "proxima",
    resultado: null,
    fecha_inicio: programadaPara.toISOString(),
    fecha_fin: modalidad === "tiempo" ? new Date(programadaPara.getTime() + duracion * 60000).toISOString() : null,
    imagen_principal: fotos[0]?.url ?? null,
    subastador: { id: usuario?.id ?? "", empresa_nombre: usuario?.empresa_nombre ?? null, ciudad: usuario?.ciudad ?? null },
  };

  return (
    <Pagina>
      <Link to="/app/mis-subastas" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4"><ArrowLeft className="w-4 h-4" />Mis subastas</Link>
      <Encabezado titulo="Nueva subasta" descripcion="Publica un lote de mercancía represada para que los clientes pujen por él." />

      <form onSubmit={publicar} className="grid gap-6 lg:grid-cols-12">
        <div className="lg:col-span-8 space-y-6">
          <Seccion numero={1} titulo="Fotos de la mercancía" descripcion={`Hasta ${MAX_IMAGENES} fotos JPG, PNG o WEBP de máximo ${MAX_MB} MB. La primera es la portada.`}>
            <div
              onDragOver={(e) => { e.preventDefault(); setArrastrando(true); }}
              onDragLeave={() => setArrastrando(false)}
              onDrop={alSoltar}
              className={clsx("grid grid-cols-2 sm:grid-cols-4 gap-3 rounded-xl border-2 border-dashed p-3 transition-colors", arrastrando ? "border-primary bg-primary/5 dark:border-accent dark:bg-accent/10" : "border-border")}
            >
              {fotos.map((f, i) => (
                <div key={f.id} className="group relative aspect-square rounded-lg overflow-hidden bg-muted border border-border">
                  <img src={urlMedia(f.url)} alt={`Foto ${i + 1}`} className="w-full h-full object-cover" />
                  {i === 0 && <span className="absolute top-1.5 left-1.5 inline-flex items-center gap-1 rounded-md bg-accent text-accent-foreground px-1.5 py-0.5 text-[10px] font-semibold"><Star className="w-3 h-3" />Portada</span>}
                  <div className="absolute inset-x-0 bottom-0 flex justify-between p-1.5 bg-gradient-to-t from-black/70 to-transparent">
                    <div className="flex gap-1">
                      <BotonFoto etiqueta="Mover a la izquierda" onClick={() => mover(i, -1)} disabled={i === 0}><ArrowLeft className="w-3.5 h-3.5" /></BotonFoto>
                      <BotonFoto etiqueta="Mover a la derecha" onClick={() => mover(i, 1)} disabled={i === fotos.length - 1}><ArrowRight className="w-3.5 h-3.5" /></BotonFoto>
                    </div>
                    <BotonFoto etiqueta="Quitar foto" onClick={() => setFotos((l) => l.filter((x) => x.id !== f.id))}><Trash2 className="w-3.5 h-3.5" /></BotonFoto>
                  </div>
                </div>
              ))}
              {fotos.length < MAX_IMAGENES && (
                <button type="button" onClick={() => selector.current?.click()} disabled={subiendo} className="aspect-square rounded-lg border border-border bg-card flex flex-col items-center justify-center gap-1.5 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                  {subiendo ? <Loader2 className="w-6 h-6 animate-spin" /> : <ImagePlus className="w-6 h-6" />}
                  <span className="text-xs font-medium text-center px-2">{subiendo ? "Subiendo…" : fotos.length ? "Agregar más" : "Agregar fotos o arrastrarlas aquí"}</span>
                </button>
              )}
            </div>
            <input ref={selector} type="file" accept={TIPOS.join(",")} multiple hidden onChange={(e) => e.target.files && agregarFotos(e.target.files)} />
          </Seccion>

          <Seccion numero={2} titulo="Datos del lote">
            <div className="space-y-4">
              <Input label="Título" required minLength={4} maxLength={160} placeholder="Ej: Lote de 500 audífonos inalámbricos" value={titulo} onChange={(e) => setTitulo(e.target.value)} />
              <div className="grid sm:grid-cols-3 gap-4">
                <Select label="Categoría" required value={categoria} onChange={(e) => setCategoria(e.target.value)}>
                  <option value="" disabled>Elige una</option>
                  {categorias.map((c) => <option key={c} value={c}>{c}</option>)}
                </Select>
                <Input label="Cantidad" maxLength={120} placeholder="Ej: 500 unidades, 3 pallets" value={cantidad} onChange={(e) => setCantidad(e.target.value)} />
                <Input label="Ubicación de la mercancía" maxLength={120} placeholder="Ej: Bogotá" value={ubicacion} onChange={(e) => setUbicacion(e.target.value)} />
              </div>
              <Textarea label="Descripción" required minLength={10} maxLength={5000} placeholder="Estado de la mercancía, referencias, empaque, garantía, condiciones de entrega…" value={descripcion} onChange={(e) => setDescripcion(e.target.value)} />
            </div>
          </Seccion>

          <Seccion numero={3} titulo="Precios" descripcion="Todos los valores en pesos colombianos.">
            <div className="grid sm:grid-cols-2 gap-4">
              <CampoMonto label="Precio inicial" required valor={precioInicial} alCambiar={setPrecioInicial} hint="La primera puja debe ser de al menos este valor." />
              <CampoMonto label="Incremento mínimo" required valor={incremento} alCambiar={(v) => { setIncrementoTocado(true); setIncremento(v); }} hint="Cuánto debe subir cada puja sobre la anterior." />
            </div>
            <label className="flex items-start gap-2.5 mt-4 cursor-pointer">
              <input type="checkbox" checked={conReserva} onChange={(e) => setConReserva(e.target.checked)} className="mt-1 accent-[var(--primary)]" />
              <span className="text-sm">
                <span className="font-medium">Usar precio de reserva</span>
                <span className="block text-xs text-muted-foreground">Precio mínimo secreto: si la puja más alta no lo alcanza, no estás obligado a vender.</span>
              </span>
            </label>
            {conReserva && <div className="mt-3 sm:w-1/2"><CampoMonto label="Precio de reserva" valor={reserva} alCambiar={setReserva} /></div>}
          </Seccion>

          <Seccion numero={4} titulo="Tipo de subasta">
            <div className="grid sm:grid-cols-2 gap-3 mb-4">
              <OpcionModalidad activa={modalidad === "tiempo"} onClick={() => setModalidad("tiempo")} icono={<Timer className="w-5 h-5" />} titulo="Por tiempo" texto="Abre y cierra sola. Ideal para lotes que pueden estar varios días en vitrina." />
              <OpcionModalidad activa={modalidad === "en_vivo"} onClick={() => setModalidad("en_vivo")} icono={<Radio className="w-5 h-5" />} titulo="En vivo" texto="Tú abres el martillo a la hora anunciada y adjudicas cuando quieras." />
            </div>
            {modalidad === "tiempo" ? (
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <p className="text-xs font-medium">Inicio</p>
                  <div className="flex gap-2">
                    <Chip activo={empiezaYa} onClick={() => setEmpiezaYa(true)}>Ahora mismo</Chip>
                    <Chip activo={!empiezaYa} onClick={() => setEmpiezaYa(false)}>Programar</Chip>
                  </div>
                  {!empiezaYa && <Input type="datetime-local" aria-label="Fecha de inicio" required value={inicio} min={aLocal(new Date())} onChange={(e) => setInicio(e.target.value)} />}
                </div>
                <Select label="Duración" value={duracion} onChange={(e) => setDuracion(Number(e.target.value))} hint="Si alguien puja en los últimos 2 minutos, el cierre se corre 2 minutos.">
                  {DURACIONES.map((d) => <option key={d} value={d}>{duracionLegible(d)}</option>)}
                </Select>
              </div>
            ) : (
              <div className="sm:w-1/2">
                <Input type="datetime-local" label="Fecha y hora del evento" required value={inicio} min={aLocal(new Date())} onChange={(e) => setInicio(e.target.value)} hint="Los clientes la verán como próxima. Puedes abrirla cuando estés listo." />
              </div>
            )}
          </Seccion>
        </div>

        <div className="lg:col-span-4">
          <div className="lg:sticky lg:top-6 space-y-4">
            <p className="text-xs font-medium text-muted-foreground">Así la verán los clientes</p>
            <div className="pointer-events-none"><TarjetaSubasta subasta={vistaPrevia} href="#" /></div>
            <Card className="space-y-2 text-sm">
              <Fila titulo="Precio inicial" valor={dinero(precioInicial)} />
              <Fila titulo="Incremento" valor={dinero(incremento)} />
              <Fila titulo="Reserva" valor={conReserva ? dinero(reserva) : "Sin reserva"} />
              <Fila titulo="Modalidad" valor={modalidad === "en_vivo" ? "En vivo" : `Por tiempo · ${duracionLegible(duracion)}`} />
            </Card>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" size="lg" fullWidth loading={enviando} disabled={subiendo}>Publicar subasta</Button>
            <p className="text-xs text-muted-foreground">Al publicar te comprometes a vender el lote a la puja ganadora{conReserva ? " si alcanza tu reserva" : ""}.</p>
          </div>
        </div>
      </form>
    </Pagina>
  );
}

function Seccion({ numero, titulo, descripcion, children }: { numero: number; titulo: string; descripcion?: string; children: ReactNode }) {
  return (
    <Card padding="lg">
      <div className="flex items-start gap-3 mb-4">
        <span className="w-7 h-7 rounded-lg bg-primary text-primary-foreground dark:bg-accent dark:text-accent-foreground flex items-center justify-center text-xs font-bold flex-shrink-0">{numero}</span>
        <div>
          <h2 className="text-sm font-semibold leading-7">{titulo}</h2>
          {descripcion && <p className="text-xs text-muted-foreground">{descripcion}</p>}
        </div>
      </div>
      {children}
    </Card>
  );
}

function OpcionModalidad({ activa, onClick, icono, titulo, texto }: { activa: boolean; onClick: () => void; icono: ReactNode; titulo: string; texto: string }) {
  return (
    <button type="button" onClick={onClick} aria-pressed={activa} className={clsx("flex items-start gap-3 rounded-xl border p-4 text-left transition-colors duration-200 ease-in-out", activa ? "border-primary bg-primary/5 dark:border-accent dark:bg-accent/10" : "border-border hover:bg-muted")}>
      <span className={clsx("mt-0.5", activa ? "text-primary dark:text-accent" : "text-muted-foreground")}>{icono}</span>
      <span>
        <span className="block text-sm font-semibold">{titulo}</span>
        <span className="block text-xs text-muted-foreground mt-0.5">{texto}</span>
      </span>
    </button>
  );
}

function Chip({ activo, onClick, children }: { activo: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button type="button" onClick={onClick} aria-pressed={activo} className={clsx("h-8 px-3 rounded-lg border text-xs font-medium transition-colors duration-200 ease-in-out", activo ? "border-primary bg-primary text-primary-foreground dark:border-accent dark:bg-accent dark:text-accent-foreground" : "border-border hover:bg-muted")}>
      {children}
    </button>
  );
}

function BotonFoto({ etiqueta, onClick, disabled, children }: { etiqueta: string; onClick: () => void; disabled?: boolean; children: ReactNode }) {
  return (
    <button type="button" aria-label={etiqueta} title={etiqueta} onClick={onClick} disabled={disabled} className="w-6 h-6 rounded-md bg-white/90 text-black flex items-center justify-center disabled:opacity-30 hover:bg-white">
      {children}
    </button>
  );
}

function Fila({ titulo, valor }: { titulo: string; valor: string }) {
  return <div className="flex justify-between gap-3"><span className="text-muted-foreground">{titulo}</span><span className="font-medium text-right">{valor}</span></div>;
}
