import clsx from "clsx";
import { Building2, Moon, Sun, UserRound } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Link, Navigate, useNavigate, useSearchParams } from "react-router-dom";

import { useSesion } from "../app/sesion";
import { Button, Card, Input, Logo } from "../components/ui";
import { useTema } from "../lib/tema";

/** Solo se aceptan rutas internas en `?siguiente=` para no redirigir a sitios ajenos. */
function destinoSeguro(valor: string | null): string {
  return valor && valor.startsWith("/app") ? valor : "/app";
}

export default function Acceso({ modo }: { modo: "entrar" | "registro" }) {
  const { oscuro, alternar } = useTema();
  const { usuario } = useSesion();
  const [params] = useSearchParams();
  const siguiente = destinoSeguro(params.get("siguiente"));

  if (usuario) return <Navigate to={siguiente} replace />;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="flex items-center justify-between border-b border-border bg-background px-6 py-3.5 relative z-10">
        <Link to="/"><Logo /></Link>
        <button
          onClick={(e) => alternar(e)}
          aria-label={oscuro ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
          className="w-8 h-8 flex items-center justify-center rounded-lg text-muted-foreground hover:bg-primary hover:text-primary-foreground dark:hover:bg-accent dark:hover:text-accent-foreground transition-colors"
        >
          {oscuro ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>
      </header>

      <main className="relative flex flex-1 items-center justify-center px-4 py-10 overflow-hidden">
        <div className="absolute inset-0 z-0 pointer-events-none">
          <img src={oscuro ? "/brand/fondo-2.png" : "/brand/fondo-5.png"} alt="" className="w-full h-full object-cover object-center" />
        </div>
        <div className={clsx("relative z-10 w-full", modo === "registro" ? "max-w-[520px]" : "max-w-[420px]")}>
          {modo === "entrar" ? <FormularioEntrar siguiente={siguiente} /> : <FormularioRegistro siguiente={siguiente} rolInicial={params.get("rol") === "subastador" ? "subastador" : "cliente"} />}
        </div>
      </main>

      <footer className="flex items-center justify-center border-t border-border bg-background py-4 text-xs text-muted-foreground relative z-10">
        © 2026 Zarpi Subastas · Parte de la familia Zarpi
      </footer>
    </div>
  );
}

function FormularioEntrar({ siguiente }: { siguiente: string }) {
  const { entrar } = useSesion();
  const navegar = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [enviando, setEnviando] = useState(false);

  async function enviar(e: FormEvent) {
    e.preventDefault();
    setError("");
    setEnviando(true);
    try {
      await entrar(email, password);
      navegar(siguiente, { replace: true });
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <Card padding="lg" className="shadow-xl">
      <h1 className="text-xl font-bold tracking-tight">Inicia sesión</h1>
      <p className="text-sm text-muted-foreground mt-1 mb-6">Entra para pujar o administrar tus subastas.</p>
      <form onSubmit={enviar} className="space-y-4">
        <Input label="Correo" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        <Input label="Contraseña" type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
        {error && <p className="text-sm text-destructive">{error}</p>}
        <Button type="submit" size="lg" fullWidth loading={enviando}>Entrar</Button>
      </form>
      <p className="text-sm text-muted-foreground text-center mt-6">
        ¿No tienes cuenta?{" "}
        <Link to={`/registro?siguiente=${encodeURIComponent(siguiente)}`} className="font-semibold text-primary dark:text-accent hover:underline">Regístrate gratis</Link>
      </p>
    </Card>
  );
}

function FormularioRegistro({ siguiente, rolInicial }: { siguiente: string; rolInicial: "cliente" | "subastador" }) {
  const { registrarse } = useSesion();
  const navegar = useNavigate();
  const [rol, setRol] = useState<"cliente" | "subastador">(rolInicial);
  const [datos, setDatos] = useState({ nombre: "", email: "", password: "", telefono: "", ciudad: "", empresa_nombre: "", nit: "" });
  const [error, setError] = useState("");
  const [enviando, setEnviando] = useState(false);
  const cambiar = (campo: keyof typeof datos) => (e: { target: { value: string } }) => setDatos((d) => ({ ...d, [campo]: e.target.value }));

  async function enviar(e: FormEvent) {
    e.preventDefault();
    setError("");
    setEnviando(true);
    try {
      const empresa = rol === "subastador" ? { empresa_nombre: datos.empresa_nombre, nit: datos.nit } : {};
      await registrarse({
        nombre: datos.nombre, email: datos.email, password: datos.password, rol,
        telefono: datos.telefono || undefined, ciudad: datos.ciudad || undefined, ...empresa,
      });
      navegar(rol === "subastador" ? "/app/mis-subastas" : siguiente, { replace: true });
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setEnviando(false);
    }
  }

  const opciones = [
    { valor: "cliente" as const, icono: <UserRound className="w-5 h-5" />, titulo: "Quiero pujar", texto: "Compra lotes al mejor precio" },
    { valor: "subastador" as const, icono: <Building2 className="w-5 h-5" />, titulo: "Soy empresa", texto: "Subasta mi mercancía" },
  ];

  return (
    <Card padding="lg" className="shadow-xl">
      <h1 className="text-xl font-bold tracking-tight">Crea tu cuenta</h1>
      <p className="text-sm text-muted-foreground mt-1 mb-5">Registrarse es gratis.</p>
      <div className="grid grid-cols-2 gap-3 mb-5">
        {opciones.map((o) => (
          <button
            key={o.valor}
            type="button"
            onClick={() => setRol(o.valor)}
            aria-pressed={rol === o.valor}
            className={clsx(
              "flex flex-col items-start gap-1 rounded-xl border p-3 text-left transition-colors duration-200 ease-in-out",
              rol === o.valor ? "border-primary bg-primary/5 dark:border-accent dark:bg-accent/10" : "border-border hover:bg-muted",
            )}
          >
            <span className={clsx(rol === o.valor ? "text-primary dark:text-accent" : "text-muted-foreground")}>{o.icono}</span>
            <span className="text-sm font-semibold">{o.titulo}</span>
            <span className="text-xs text-muted-foreground">{o.texto}</span>
          </button>
        ))}
      </div>
      <form onSubmit={enviar} className="space-y-4">
        {rol === "subastador" && (
          <div className="grid sm:grid-cols-2 gap-4">
            <Input label="Razón social" required value={datos.empresa_nombre} onChange={cambiar("empresa_nombre")} />
            <Input label="NIT" required value={datos.nit} onChange={cambiar("nit")} />
          </div>
        )}
        <Input label={rol === "subastador" ? "Nombre del responsable" : "Nombre completo"} required minLength={2} autoComplete="name" value={datos.nombre} onChange={cambiar("nombre")} />
        <Input label="Correo" type="email" required autoComplete="email" value={datos.email} onChange={cambiar("email")} />
        <Input label="Contraseña" type="password" required minLength={8} autoComplete="new-password" hint="Mínimo 8 caracteres" value={datos.password} onChange={cambiar("password")} />
        <div className="grid sm:grid-cols-2 gap-4">
          <Input label="Teléfono / WhatsApp" type="tel" autoComplete="tel" value={datos.telefono} onChange={cambiar("telefono")} />
          <Input label="Ciudad" autoComplete="address-level2" value={datos.ciudad} onChange={cambiar("ciudad")} />
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <Button type="submit" size="lg" className="dark:bg-accent" fullWidth loading={enviando}>{rol === "subastador" ? "Registrar mi empresa" : "Crear cuenta"}</Button>
      </form>
      <p className="text-sm text-muted-foreground text-center mt-6">
        ¿Ya tienes cuenta?{" "}
        <Link to={`/entrar?siguiente=${encodeURIComponent(siguiente)}`} className="font-semibold text-primary dark:text-accent hover:underline">Inicia sesión</Link>
      </p>
    </Card>
  );
}
