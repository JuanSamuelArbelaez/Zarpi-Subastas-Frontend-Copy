const formatoCop = new Intl.NumberFormat("es-CO", { maximumFractionDigits: 0 });

/** $ 1.250.000 COP */
export function dinero(monto: number | null | undefined, moneda = "COP"): string {
  if (monto === null || monto === undefined) return "—";
  return `$ ${formatoCop.format(monto)} ${moneda}`;
}

/** $ 1.250.000, sin moneda, para espacios cortos. */
export function dineroCorto(monto: number | null | undefined): string {
  if (monto === null || monto === undefined) return "—";
  return `$ ${formatoCop.format(monto)}`;
}

export function fechaHora(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("es-CO", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });
}

export function hora(iso: string): string {
  return new Date(iso).toLocaleTimeString("es-CO", { hour: "numeric", minute: "2-digit" });
}

export function haceCuanto(iso: string): string {
  const segundos = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (segundos < 60) return "hace un momento";
  const minutos = Math.floor(segundos / 60);
  if (minutos < 60) return `hace ${minutos} min`;
  const horas = Math.floor(minutos / 60);
  if (horas < 24) return `hace ${horas} h`;
  return fechaHora(iso);
}

/** "2 d 4 h", "3 h 12 min", "04:59" (bajo una hora se muestran segundos). */
export function tiempoRestante(ms: number): string {
  if (ms <= 0) return "00:00";
  const total = Math.floor(ms / 1000);
  const dias = Math.floor(total / 86400);
  const horas = Math.floor((total % 86400) / 3600);
  const minutos = Math.floor((total % 3600) / 60);
  const segundos = total % 60;
  if (dias > 0) return `${dias} d ${horas} h`;
  if (horas > 0) return `${horas} h ${minutos} min`;
  return `${String(minutos).padStart(2, "0")}:${String(segundos).padStart(2, "0")}`;
}

export function duracionLegible(minutos: number): string {
  if (minutos % 1440 === 0) return `${minutos / 1440} ${minutos === 1440 ? "día" : "días"}`;
  if (minutos % 60 === 0) return `${minutos / 60} ${minutos === 60 ? "hora" : "horas"}`;
  return `${minutos} minutos`;
}
