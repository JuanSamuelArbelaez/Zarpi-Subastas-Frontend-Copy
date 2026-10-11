import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

import { api, guardarToken, leerToken, type DatosRegistro } from "../lib/api";
import type { Usuario } from "../lib/types";

interface ContextoSesion {
  usuario: Usuario | null;
  cargando: boolean;
  entrar: (email: string, password: string) => Promise<Usuario>;
  registrarse: (datos: DatosRegistro) => Promise<Usuario>;
  salir: () => void;
}

const Contexto = createContext<ContextoSesion | null>(null);

export function ProveedorSesion({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [cargando, setCargando] = useState(Boolean(leerToken()));

  useEffect(() => {
    if (!leerToken()) return;
    api.yo()
      .then(setUsuario)
      .catch(() => guardarToken(null))
      .finally(() => setCargando(false));
  }, []);

  const entrar = useCallback(async (email: string, password: string) => {
    const sesion = await api.login(email, password);
    guardarToken(sesion.token);
    setUsuario(sesion.usuario);
    return sesion.usuario;
  }, []);

  const registrarse = useCallback(async (datos: DatosRegistro) => {
    const sesion = await api.registrar(datos);
    guardarToken(sesion.token);
    setUsuario(sesion.usuario);
    return sesion.usuario;
  }, []);

  const salir = useCallback(() => {
    guardarToken(null);
    setUsuario(null);
  }, []);

  const valor = useMemo(() => ({ usuario, cargando, entrar, registrarse, salir }), [usuario, cargando, entrar, registrarse, salir]);
  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>;
}

export function useSesion() {
  const contexto = useContext(Contexto);
  if (!contexto) throw new Error("useSesion fuera de ProveedorSesion");
  return contexto;
}
