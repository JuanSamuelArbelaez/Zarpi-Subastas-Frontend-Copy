import { Gavel, Radio, Search } from "lucide-react";
import { useEffect, useState } from "react";

import { TarjetaSubasta } from "../components/subasta";
import { Cargando, Encabezado, Input, Pagina, Segmentos, Select, Vacio } from "../components/ui";
import { useSubastasEnVivo } from "../components/useSubastasEnVivo";
import { api, type FiltrosSubastas } from "../lib/api";
import { useRutaBase } from "../lib/rutas";
import type { SubastaResumen } from "../lib/types";

type Estado = NonNullable<FiltrosSubastas["estado"]>;
type ModalidadFiltro = "todas" | "tiempo" | "en_vivo";

export default function Explorar() {
  const [categorias, setCategorias] = useState<string[]>([]);
  const [busqueda, setBusqueda] = useState("");
  const [q, setQ] = useState("");
  const [categoria, setCategoria] = useState("");
  const [estado, setEstado] = useState<Estado>("vigentes");
  const [modalidad, setModalidad] = useState<ModalidadFiltro>("todas");
  const [orden, setOrden] = useState<NonNullable<FiltrosSubastas["orden"]>>("cierre");
  const [datos, setDatos] = useState<SubastaResumen[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const subastas = useSubastasEnVivo(datos);
  const base = useRutaBase();

  useEffect(() => { api.categorias().then(setCategorias).catch(() => {}); }, []);

  // Se espera a que la persona deje de escribir antes de buscar.
  useEffect(() => {
    const id = setTimeout(() => setQ(busqueda.trim()), 300);
    return () => clearTimeout(id);
  }, [busqueda]);

  useEffect(() => {
    let vigente = true;
    setCargando(true);
    setError("");
    api.subastas({ estado, categoria: categoria || undefined, q: q || undefined, modalidad: modalidad === "todas" ? undefined : modalidad, orden, limite: 60 })
      .then((r) => vigente && setDatos(r))
      .catch((e) => vigente && setError((e as Error).message))
      .finally(() => vigente && setCargando(false));
    return () => { vigente = false; };
  }, [estado, categoria, q, modalidad, orden]);

  const enVivo = subastas.filter((s) => s.estado === "activa" && s.modalidad === "en_vivo");

  return (
    <Pagina>
      <Encabezado titulo="Subastas" descripcion={base ? "Mercancía de mayoristas, distribuidores e importadores al mejor postor." : "Mira los lotes sin cuenta. Para pujar o chatear te pediremos entrar o registrarte gratis."} />

      {enVivo.length > 0 && estado !== "finalizada" && (
        <div className="mb-6 rounded-2xl bg-foreground text-background p-4 sm:p-5 relative overflow-hidden">
          <div className="absolute inset-0 bg-primary/30 pointer-events-none" />
          <div className="relative flex items-center gap-3">
            <span className="w-10 h-10 rounded-xl bg-destructive text-white flex items-center justify-center flex-shrink-0"><Radio className="w-5 h-5" /></span>
            <div className="min-w-0">
              <p className="font-semibold">{enVivo.length === 1 ? "Hay 1 subasta en vivo ahora" : `Hay ${enVivo.length} subastas en vivo ahora`}</p>
              <p className="text-sm text-background/70 truncate">{enVivo.map((s) => s.titulo).join(" · ")}</p>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-3 mb-6">
        <div className="grid sm:grid-cols-[1fr_200px_180px] gap-3">
          <Input aria-label="Buscar" placeholder="Buscar lotes: celulares, telas, herramientas…" prefix={<Search className="w-4 h-4" />} value={busqueda} onChange={(e) => setBusqueda(e.target.value)} />
          <Select aria-label="Categoría" value={categoria} onChange={(e) => setCategoria(e.target.value)}>
            <option value="">Todas las categorías</option>
            {categorias.map((c) => <option key={c} value={c}>{c}</option>)}
          </Select>
          <Select aria-label="Orden" value={orden} onChange={(e) => setOrden(e.target.value as typeof orden)}>
            <option value="cierre">Cierran primero</option>
            <option value="recientes">Más recientes</option>
            <option value="precio_asc">Menor precio</option>
            <option value="precio_desc">Mayor precio</option>
          </Select>
        </div>
        <div className="flex flex-wrap gap-2">
          <Segmentos<Estado>
            valor={estado}
            alCambiar={setEstado}
            opciones={[
              { valor: "vigentes", texto: "Activas y próximas" },
              { valor: "activa", texto: "Activas" },
              { valor: "proxima", texto: "Próximas" },
              { valor: "finalizada", texto: "Finalizadas" },
            ]}
          />
          <Segmentos<ModalidadFiltro>
            valor={modalidad}
            alCambiar={setModalidad}
            opciones={[
              { valor: "todas", texto: "Todas" },
              { valor: "en_vivo", texto: "En vivo" },
              { valor: "tiempo", texto: "Por tiempo" },
            ]}
          />
        </div>
      </div>

      {cargando ? (
        <Cargando texto="Buscando subastas…" />
      ) : error ? (
        <Vacio icono={<Gavel className="w-6 h-6" />} titulo="No pudimos cargar las subastas" texto={error} />
      ) : subastas.length === 0 ? (
        <Vacio icono={<Gavel className="w-6 h-6" />} titulo="No hay subastas con estos filtros" texto="Prueba con otra categoría o vuelve pronto: las empresas publican lotes nuevos cada semana." />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 zarpi-stagger">
          {subastas.map((s) => <TarjetaSubasta key={s.id} subasta={s} href={`${base}/subastas/${s.id}`} />)}
        </div>
      )}
    </Pagina>
  );
}
