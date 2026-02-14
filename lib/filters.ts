export function parseLeaderFilterValue(v: string | null | undefined) {
  const s = (v || "all").trim();
  if (s === "" || s === "all") return { kind: "all" as const };
  if (s === "none") return { kind: "none" as const };
  const id = Number(s);
  if (Number.isFinite(id) && id > 0) return { kind: "id" as const, id };
  return { kind: "all" as const };
}
