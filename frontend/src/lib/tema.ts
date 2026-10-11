import { useEffect, useState } from "react";

const CLAVE = "zarpi-theme";
const EVENTO = "zarpi-theme-change";
type OrigenTransicion = { clientX: number; clientY: number };

function aplicar(oscuro: boolean) {
  document.documentElement.classList.toggle("dark", oscuro);
  document.documentElement.style.colorScheme = oscuro ? "dark" : "light";
}

function leer(): boolean {
  try { return localStorage.getItem(CLAVE) === "dark"; } catch { return false; }
}

/** Mismo interruptor claro/oscuro de Zarpi (y la misma clave, por si comparten dominio). */
export function useTema() {
  const [oscuro, setOscuro] = useState(leer);

  useEffect(() => {
    aplicar(oscuro);
    const alCambiar = (e: Event) => setOscuro((e as CustomEvent<boolean>).detail);
    window.addEventListener(EVENTO, alCambiar);
    return () => window.removeEventListener(EVENTO, alCambiar);
  }, [oscuro]);

  function alternar(origen?: OrigenTransicion) {
    const siguiente = !oscuro;
    try { localStorage.setItem(CLAVE, siguiente ? "dark" : "light"); } catch { /* sin almacenamiento */ }
    const cambiar = () => {
      aplicar(siguiente);
      window.dispatchEvent(new CustomEvent(EVENTO, { detail: siguiente }));
    };
    const transiciones = document as Document & {
      startViewTransition?: (actualizar: () => void) => { finished: Promise<void> };
    };
    if (origen && transiciones.startViewTransition) {
      const radio = Math.hypot(Math.max(origen.clientX, window.innerWidth - origen.clientX), Math.max(origen.clientY, window.innerHeight - origen.clientY));
      document.documentElement.style.setProperty("--zarpi-theme-x", `${origen.clientX}px`);
      document.documentElement.style.setProperty("--zarpi-theme-y", `${origen.clientY}px`);
      document.documentElement.style.setProperty("--zarpi-theme-radius", `${radio}px`);
      document.documentElement.dataset.themeTransition = siguiente ? "dark" : "light";
      const vista = transiciones.startViewTransition(cambiar);
      vista.finished.finally(() => {
        delete document.documentElement.dataset.themeTransition;
      });
    } else {
      cambiar();
    }
  }

  return { oscuro, alternar };
}
