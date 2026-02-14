export const CO_TIMEZONE = "America/Bogota";

export function formatDateTimeCO(date: Date | string | null | undefined): string {
  if (!date) return "";
  const d = typeof date === "string" ? new Date(date) : date;
  const fmt = new Intl.DateTimeFormat("es-CO", {
    timeZone: CO_TIMEZONE,
    year: "numeric",
    month: "long",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true
  });
  return fmt.format(d);
}

export function formatIsoCO(date: Date | string | null | undefined): string {
  // Para exportaciones: YYYY-MM-DD HH:mm:ss (Colombia)
  if (!date) return "";
  const d = typeof date === "string" ? new Date(date) : date;

  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: CO_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false
  }).formatToParts(d);

  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  return `${get("year")}-${get("month")}-${get("day")} ${get("hour")}:${get("minute")}:${get("second")}`;
}

export function nowStampCO(): string {
  // YYYYMMDD_HHMMSS en hora Colombia para nombres de archivos
  const now = new Date();
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: CO_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false
  }).formatToParts(now);

  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  return `${get("year")}${get("month")}${get("day")}_${get("hour")}${get("minute")}${get("second")}`;
}
