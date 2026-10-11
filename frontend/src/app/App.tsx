import { BrowserRouter, Navigate, Route, Routes, useLocation } from "react-router-dom";
import { Toaster } from "sonner";
import type { ReactNode } from "react";

import { Cargando } from "../components/ui";
import { useTema } from "../lib/tema";
import type { Rol } from "../lib/types";
import Acceso from "../pages/Acceso";
import DetalleSubasta from "../pages/DetalleSubasta";
import Explorar from "../pages/Explorar";
import Landing from "../pages/Landing";
import Mensajes from "../pages/Mensajes";
import MisPujas from "../pages/MisPujas";
import MisSubastas from "../pages/MisSubastas";
import NuevaSubasta from "../pages/NuevaSubasta";
import Notificaciones from "../pages/Notificaciones";
import { ProveedorEnVivo } from "./enVivo";
import { Panel } from "./Panel";
import { SitioPublico, SoloVisitantes } from "./SitioPublico";
import { ProveedorSesion, useSesion } from "./sesion";

function Protegida({ children, roles }: { children: ReactNode; roles?: Rol[] }) {
  const { usuario, cargando } = useSesion();
  const ubicacion = useLocation();
  if (cargando) return <Cargando />;
  if (!usuario) return <Navigate to={`/entrar?siguiente=${encodeURIComponent(ubicacion.pathname)}`} replace />;
  if (roles && !roles.includes(usuario.rol)) return <Navigate to="/app" replace />;
  return <>{children}</>;
}

function Inicio() {
  const { usuario } = useSesion();
  return <Navigate to={usuario?.rol === "subastador" ? "/app/mis-subastas" : "/app/subastas"} replace />;
}

function Notificador() {
  const { oscuro } = useTema();
  return <Toaster position="bottom-right" richColors closeButton theme={oscuro ? "dark" : "light"} />;
}

export default function App() {
  return (
    <BrowserRouter>
      <ProveedorSesion>
        <ProveedorEnVivo>
          <Notificador />
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/entrar" element={<Acceso modo="entrar" />} />
            <Route path="/registro" element={<Acceso modo="registro" />} />
            {/* Catálogo abierto: cualquiera mira; pujar o chatear pide cuenta. */}
            <Route element={<SoloVisitantes><SitioPublico /></SoloVisitantes>}>
              <Route path="/subastas" element={<Explorar />} />
              <Route path="/subastas/:id" element={<DetalleSubasta />} />
            </Route>
            <Route path="/app" element={<Protegida><Panel /></Protegida>}>
              <Route index element={<Inicio />} />
              <Route path="subastas" element={<Explorar />} />
              <Route path="subastas/:id" element={<DetalleSubasta />} />
              <Route path="mis-pujas" element={<Protegida roles={["cliente"]}><MisPujas /></Protegida>} />
              <Route path="mis-subastas" element={<Protegida roles={["subastador"]}><MisSubastas /></Protegida>} />
              <Route path="nueva" element={<Protegida roles={["subastador"]}><NuevaSubasta /></Protegida>} />
              <Route path="mensajes" element={<Mensajes />} />
              <Route path="mensajes/:conversacionId" element={<Mensajes />} />
              <Route path="notificaciones" element={<Notificaciones />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </ProveedorEnVivo>
      </ProveedorSesion>
    </BrowserRouter>
  );
}
