import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/require-auth";
import { normalizeText } from "@/lib/normalize";
import { toggleLeaderCheckInAction } from "@/app/actions/leaders";
import { FlashMessage } from "@/components/FlashMessage";
import { formatDateTimeCO } from "@/lib/time";

const PAGE_SIZE = 10;

export default async function LeadersPage({
  searchParams
}: {
  searchParams: { q?: string; flash?: string; tone?: string; pagePending?: string; pageChecked?: string };
}) {
  await requireAuth();

  const q = (searchParams.q || "").trim();
  const qNorm = q ? normalizeText(q) : "";

  const pagePending = Math.max(1, parseInt(searchParams.pagePending || "1", 10));
  const pageChecked = Math.max(1, parseInt(searchParams.pageChecked || "1", 10));

  const where = qNorm
    ? {
        OR: [
          { nombresNorm: { contains: qNorm } },
          { apellidosNorm: { contains: qNorm } },
          { cedulaNorm: { contains: qNorm } },
          { telefonoNorm: { contains: qNorm } },
          { zonaBarrioNorm: { contains: qNorm } }
        ]
      }
    : {};

  const [
    leadersPending,
    leadersChecked,
    totalPending,
    totalChecked,
    counts
  ] = await Promise.all([
    prisma.leader.findMany({
      where: { ...where, checkedIn: false },
      orderBy: [{ apellidosLider: "asc" }, { nombresLider: "asc" }],
      skip: (pagePending - 1) * PAGE_SIZE,
      take: PAGE_SIZE
    }),
    prisma.leader.findMany({
      where: { ...where, checkedIn: true },
      orderBy: [{ checkedInAt: "desc" }],
      skip: (pageChecked - 1) * PAGE_SIZE,
      take: PAGE_SIZE
    }),
    prisma.leader.count({ where: { ...where, checkedIn: false } }),
    prisma.leader.count({ where: { ...where, checkedIn: true } }),
    prisma.voter.groupBy({
      by: ["leaderId"],
      where: { leaderId: { not: null } },
      _count: { _all: true }
    })
  ]);

  const countMap = new Map<number, number>();
  for (const c of counts) {
    if (c.leaderId) countMap.set(c.leaderId, c._count._all);
  }

  const totalPagesPending = Math.max(1, Math.ceil(totalPending / PAGE_SIZE));
  const totalPagesChecked = Math.max(1, Math.ceil(totalChecked / PAGE_SIZE));

  const flash = searchParams.flash ? decodeURIComponent(searchParams.flash) : "";
  const tone =
    searchParams.tone === "success" || searchParams.tone === "warning" || searchParams.tone === "danger"
      ? (searchParams.tone as any)
      : "info";

  /** Builds a href preserving all current searchParams but overriding specific ones */
  function buildHref(overrides: Record<string, string | number>) {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    params.set("pagePending", String(pagePending));
    params.set("pageChecked", String(pageChecked));
    for (const [k, v] of Object.entries(overrides)) {
      params.set(k, String(v));
    }
    return `/leaders?${params.toString()}`;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-4 md:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-6">

        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl bg-white/80 p-6 shadow-lg backdrop-blur-sm">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">
              Gestión de Líderes
            </h1>
            <p className="text-sm text-slate-600">
              Controla la asistencia de tus líderes en tiempo real
            </p>
          </div>
          <Link
            href="/leaders/new"
            className="group inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md transition-all hover:shadow-lg hover:scale-105"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Nuevo líder
          </Link>
        </div>

        {/* Flash */}
        {flash && (
          <div className="animate-fade-in">
            <FlashMessage message={flash} tone={tone} />
          </div>
        )}

        {/* Search */}
        <form
          className="rounded-xl bg-white/80 p-5 shadow-lg backdrop-blur-sm transition-all hover:shadow-xl"
          method="get"
        >
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <svg
                className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400"
                fill="none" stroke="currentColor" viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                name="q"
                defaultValue={q}
                placeholder="Buscar por nombre, cédula, teléfono, zona..."
                className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm transition-all focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
            <div className="flex gap-2">
              <button
                className="rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-medium text-white transition-all hover:bg-slate-800 hover:shadow-md"
                type="submit"
              >
                Buscar
              </button>
              <Link
                className="rounded-lg border border-slate-200 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 transition-all hover:bg-slate-50 hover:shadow-md"
                href="/leaders"
              >
                Limpiar
              </Link>
            </div>
          </div>
        </form>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 p-6 text-white shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-100">Por llegar</p>
                <p className="mt-1 text-3xl font-bold">{totalPending}</p>
              </div>
              <div className="rounded-full bg-white/20 p-3">
                <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>
          <div className="rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 p-6 text-white shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-100">Confirmados</p>
                <p className="mt-1 text-3xl font-bold">{totalChecked}</p>
              </div>
              <div className="rounded-full bg-white/20 p-3">
                <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* ── Pending Leaders ── */}
        <section className="rounded-xl bg-white/80 shadow-lg backdrop-blur-sm">
          <div className="border-b border-slate-200 bg-gradient-to-r from-amber-50 to-orange-50 p-5 rounded-t-xl">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-amber-500 p-2">
                <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900">Por llegar</h2>
                <p className="text-xs text-slate-600">Marca con ✓ cuando el líder llegue</p>
              </div>
            </div>
          </div>

          <div className="p-5">
            <div className="overflow-x-auto rounded-lg border border-slate-200">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">
                  <tr>
                    <th className="px-4 py-3">Nombres</th>
                    <th className="px-4 py-3">Apellidos</th>
                    <th className="px-4 py-3">Cédula</th>
                    <th className="px-4 py-3">Teléfono</th>
                    <th className="px-4 py-3">Zona/Barrio</th>
                    <th className="px-4 py-3 text-right">Votantes</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {leadersPending.map((l) => (
                    <tr key={l.id} className="transition-colors hover:bg-slate-50">
                      <td className="px-4 py-3">
                        <Link className="font-medium text-blue-600 hover:text-blue-700 hover:underline" href={`/leaders/${l.id}`}>
                          {l.nombresLider}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-slate-700">{l.apellidosLider}</td>
                      <td className="px-4 py-3 text-slate-600">{l.cedulaLider ?? "—"}</td>
                      <td className="px-4 py-3 text-slate-600">{l.telefono ?? "—"}</td>
                      <td className="px-4 py-3 text-slate-600">{l.zonaBarrio ?? "—"}</td>
                      <td className="px-4 py-3 text-right">
                        <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700">
                          {countMap.get(l.id) ?? 0}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-2">
                          <Link
                            className="rounded-md bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-700 transition-all hover:bg-slate-200"
                            href={`/leaders/${l.id}/edit`}
                          >
                            Editar
                          </Link>
                          <form action={toggleLeaderCheckInAction.bind(null, l.id)}>
                            <button
                              className="rounded-md bg-green-500 px-3 py-1.5 text-xs font-medium text-white transition-all hover:bg-green-600 hover:shadow-md"
                              type="submit"
                              title="Marcar que llegó"
                            >
                              ✓
                            </button>
                          </form>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {leadersPending.length === 0 && (
                    <tr>
                      <td className="px-4 py-8 text-center text-sm text-slate-500" colSpan={7}>
                        <div className="flex flex-col items-center gap-2">
                          <svg className="h-12 w-12 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                          </svg>
                          <p className="font-medium">No hay líderes pendientes</p>
                          {q && <p className="text-xs">Intenta con otro término de búsqueda</p>}
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination — Pending */}
            {totalPagesPending > 1 && (
              <Pagination
                currentPage={pagePending}
                totalPages={totalPagesPending}
                total={totalPending}
                pageSize={PAGE_SIZE}
                prevHref={pagePending > 1 ? buildHref({ pagePending: pagePending - 1 }) : null}
                nextHref={pagePending < totalPagesPending ? buildHref({ pagePending: pagePending + 1 }) : null}
                buildPageHref={(p) => buildHref({ pagePending: p })}
              />
            )}
          </div>
        </section>

        {/* ── Checked Leaders ── */}
        <section className="rounded-xl bg-white/80 shadow-lg backdrop-blur-sm">
          <div className="border-b border-slate-200 bg-gradient-to-r from-green-50 to-emerald-50 p-5 rounded-t-xl">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-green-500 p-2">
                <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900">Líderes confirmados</h2>
                <p className="text-xs text-slate-600">Si te equivocaste, desmarca con ↩</p>
              </div>
            </div>
          </div>

          <div className="p-5">
            <div className="overflow-x-auto rounded-lg border border-slate-200">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">
                  <tr>
                    <th className="px-4 py-3">Nombres</th>
                    <th className="px-4 py-3">Apellidos</th>
                    <th className="px-4 py-3">Cédula</th>
                    <th className="px-4 py-3">Teléfono</th>
                    <th className="px-4 py-3">Zona/Barrio</th>
                    <th className="px-4 py-3 text-right">Votantes</th>
                    <th className="px-4 py-3">Hora</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {leadersChecked.map((l) => (
                    <tr key={l.id} className="transition-colors hover:bg-slate-50">
                      <td className="px-4 py-3">
                        <Link className="font-medium text-blue-600 hover:text-blue-700 hover:underline" href={`/leaders/${l.id}`}>
                          {l.nombresLider}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-slate-700">{l.apellidosLider}</td>
                      <td className="px-4 py-3 text-slate-600">{l.cedulaLider ?? "—"}</td>
                      <td className="px-4 py-3 text-slate-600">{l.telefono ?? "—"}</td>
                      <td className="px-4 py-3 text-slate-600">{l.zonaBarrio ?? "—"}</td>
                      <td className="px-4 py-3 text-right">
                        <span className="inline-flex items-center rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-bold text-green-700">
                          {countMap.get(l.id) ?? 0}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1 text-xs text-slate-500">
                          <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          {formatDateTimeCO(l.checkedInAt)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <form action={toggleLeaderCheckInAction.bind(null, l.id)} className="flex justify-end">
                          <button
                            className="rounded-md bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-700 transition-all hover:bg-slate-200"
                            type="submit"
                            title="Desmarcar"
                          >
                            ↩
                          </button>
                        </form>
                      </td>
                    </tr>
                  ))}
                  {leadersChecked.length === 0 && (
                    <tr>
                      <td className="px-4 py-8 text-center text-sm text-slate-500" colSpan={8}>
                        <div className="flex flex-col items-center gap-2">
                          <svg className="h-12 w-12 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                          </svg>
                          <p className="font-medium">Aún no hay líderes confirmados</p>
                          <p className="text-xs">Marca a los líderes cuando lleguen</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination — Checked */}
            {totalPagesChecked > 1 && (
              <Pagination
                currentPage={pageChecked}
                totalPages={totalPagesChecked}
                total={totalChecked}
                pageSize={PAGE_SIZE}
                prevHref={pageChecked > 1 ? buildHref({ pageChecked: pageChecked - 1 }) : null}
                nextHref={pageChecked < totalPagesChecked ? buildHref({ pageChecked: pageChecked + 1 }) : null}
                buildPageHref={(p) => buildHref({ pageChecked: p })}
              />
            )}
          </div>
        </section>

      </div>
    </div>
  );
}

/* ─── Pagination component ─────────────────────────────────────────────── */

function Pagination({
  currentPage,
  totalPages,
  total,
  pageSize,
  prevHref,
  nextHref,
  buildPageHref
}: {
  currentPage: number;
  totalPages: number;
  total: number;
  pageSize: number;
  prevHref: string | null;
  nextHref: string | null;
  buildPageHref: (page: number) => string;
}) {
  const from = (currentPage - 1) * pageSize + 1;
  const to = Math.min(currentPage * pageSize, total);

  // Show at most 5 page buttons, centered around the current page
  const pages: (number | "…")[] = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    if (currentPage > 3) pages.push("…");
    for (
      let i = Math.max(2, currentPage - 1);
      i <= Math.min(totalPages - 1, currentPage + 1);
      i++
    ) {
      pages.push(i);
    }
    if (currentPage < totalPages - 2) pages.push("…");
    pages.push(totalPages);
  }

  return (
    <div className="mt-4 flex flex-col items-center justify-between gap-3 sm:flex-row">
      {/* Info */}
      <p className="text-xs text-slate-500">
        Mostrando <span className="font-semibold text-slate-700">{from}–{to}</span> de{" "}
        <span className="font-semibold text-slate-700">{total}</span> líderes
      </p>

      {/* Controls */}
      <div className="flex items-center gap-1">
        {/* Prev */}
        {prevHref ? (
          <Link
            href={prevHref}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 bg-white text-sm text-slate-600 transition-all hover:bg-slate-50 hover:shadow-sm"
            aria-label="Página anterior"
          >
            ‹
          </Link>
        ) : (
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-100 bg-slate-50 text-sm text-slate-300 cursor-not-allowed">
            ‹
          </span>
        )}

        {/* Page numbers */}
        {pages.map((p, i) =>
          p === "…" ? (
            <span key={`ellipsis-${i}`} className="inline-flex h-8 w-8 items-center justify-center text-sm text-slate-400">
              …
            </span>
          ) : p === currentPage ? (
            <span
              key={p}
              className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-blue-600 text-xs font-semibold text-white shadow-sm"
            >
              {p}
            </span>
          ) : (
            <Link
              key={p}
              href={buildPageHref(p)}
              className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 bg-white text-xs text-slate-600 transition-all hover:bg-slate-50 hover:shadow-sm"
            >
              {p}
            </Link>
          )
        )}

        {/* Next */}
        {nextHref ? (
          <Link
            href={nextHref}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 bg-white text-sm text-slate-600 transition-all hover:bg-slate-50 hover:shadow-sm"
            aria-label="Página siguiente"
          >
            ›
          </Link>
        ) : (
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-100 bg-slate-50 text-sm text-slate-300 cursor-not-allowed">
            ›
          </span>
        )}
      </div>
    </div>
  );
}