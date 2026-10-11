import { useLocation } from "react-router-dom";

/** "/app" dentro del panel y "" en el catálogo público, para armar los enlaces. */
export function useRutaBase() {
  return useLocation().pathname.startsWith("/app") ? "/app" : "";
}
