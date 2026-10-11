import { Gavel, LogIn, MessageCircle, UserRound } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";

import { Button, Modal } from "./ui";

export type MotivoAcceso = "pujar" | "chatear" | "preguntar";

const TEXTOS: Record<MotivoAcceso, { titulo: string; texto: string }> = {
  pujar: {
    titulo: "Crea tu cuenta para pujar",
    texto: "Para pujar necesitas una cuenta de cliente. Es gratis y no pagas nada al pujar: solo si ganas acuerdas el pago con la empresa.",
  },
  chatear: {
    titulo: "Entra para escribir en la sala",
    texto: "Cualquiera puede leer la sala, pero para escribir necesitas una cuenta. Así la empresa sabe quién pregunta.",
  },
  preguntar: {
    titulo: "Entra para hablar con la empresa",
    texto: "El chat privado con la empresa es para clientes registrados. Crea tu cuenta gratis o inicia sesión.",
  },
};

/** Ventana que aparece cuando un visitante intenta pujar o chatear sin sesión. */
export function ModalAcceso({ motivo, alCerrar }: { motivo: MotivoAcceso | null; alCerrar: () => void }) {
  const navegar = useNavigate();
  const { pathname } = useLocation();
  // Al entrar o registrarse, vuelve a esta misma subasta, ya dentro del panel.
  const siguiente = encodeURIComponent(pathname.startsWith("/app") ? pathname : `/app${pathname}`);
  const textos = TEXTOS[motivo ?? "pujar"];
  const Icono = motivo === "pujar" ? Gavel : MessageCircle;

  return (
    <Modal abierto={motivo !== null} alCerrar={alCerrar} titulo={textos.titulo} ancho="max-w-md">
      <div className="space-y-5">
        <div className="flex items-start gap-3">
          <span className="w-10 h-10 rounded-xl bg-primary/10 text-primary dark:bg-accent/15 dark:text-accent flex items-center justify-center flex-shrink-0">
            <Icono className="w-5 h-5" />
          </span>
          <p className="text-sm text-muted-foreground">{textos.texto}</p>
        </div>
        <div className="grid sm:grid-cols-2 gap-2">
          <Button size="lg" icon={<UserRound className="w-4 h-4" />} onClick={() => navegar(`/registro?siguiente=${siguiente}`)} autoFocus>
            Crear cuenta
          </Button>
          <Button size="lg" variant="secondary" icon={<LogIn className="w-4 h-4" />} onClick={() => navegar(`/entrar?siguiente=${siguiente}`)}>
            Iniciar sesión
          </Button>
        </div>
      </div>
    </Modal>
  );
}
