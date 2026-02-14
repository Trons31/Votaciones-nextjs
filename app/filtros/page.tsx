import Link from "next/link";
import { requireAuth } from "@/lib/require-auth";
import { prisma } from "@/lib/prisma";
import { FlashMessage } from "@/components/FlashMessage";

function parseLeaderFilter(v: string | undefined): { kind: "all" } | { kind: "none" } | { kind: "id"; id: number } {
  const s = (v || "all").trim();
  if (s === "" || s === "all") return { kind: "all" };
  if (s === "none") return { kind: "none" };
  const id = Number(s);
  if (Number.isFinite(id) && id > 0) return { kind: "id", id };
  return { kind: "all" };
}

export default async function FiltrosPage({
  searchParams
}: {
  searchParams: { leader?: string; colegio?: string; mesa?: string; flash?: string; tone?: string };
}) {
  await requireAuth();

  const leaderFilter = parseLeaderFilter(searchParams.leader);
  const colegio = (searchParams.colegio || "").trim();
  const mesa = (searchParams.mesa || "").trim();

  const leaderWhere =
    leaderFilter.kind === "none"
      ? { leaderId: null as any }
      : leaderFilter.kind === "id"
        ? { leaderId: leaderFilter.id }
        : {};

  const whereFiltered: any = {
    ...leaderWhere,
    ...(colegio ? { dondeVota: colegio } : {}),
    ...(mesa ? { mesaVotacion: mesa } : {})
  };

  const [leaders, colegiosRows, totalGeneral, totalFiltered] = await Promise.all([
    prisma.leader.findMany({
      orderBy: [{ apellidosLider: "asc" }, { nombresLider: "asc" }],
      select: { id: true, nombresLider: true, apellidosLider: true }
    }),
    prisma.voter.findMany({
      where: { dondeVota: { not: null }, NOT: { dondeVota: "" } },
      distinct: ["dondeVota"],
      select: { dondeVota: true },
      orderBy: { dondeVota: "asc" }
    }),
    prisma.voter.count(),
    prisma.voter.count({ where: whereFiltered })
  ]);

  const colegios = colegiosRows.map((r) => r.dondeVota!).filter(Boolean);

  const mesasRows = colegio
    ? await prisma.voter.findMany({
        where: { dondeVota: colegio, mesaVotacion: { not: null }, NOT: { mesaVotacion: "" } },
        distinct: ["mesaVotacion"],
        select: { mesaVotacion: true },
        orderBy: { mesaVotacion: "asc" }
      })
    : [];

  const mesas = mesasRows.map((r) => r.mesaVotacion!).filter(Boolean);

  const voters = await prisma.voter.findMany({
    where: whereFiltered,
    include: { leader: { select: { id: true, nombresLider: true, apellidosLider: true } } },
    orderBy: [{ apellidos: "asc" }, { nombres: "asc" }],
    take: 500
  });

  const truncated = totalFiltered > 500;

  // Total por colegio (si hay colegio)
  const totalColegio =
    colegio
      ? await prisma.voter.count({
          where: { ...leaderWhere, dondeVota: colegio }
        })
      : null;

  // Distribución por colegio (si no hay colegio)
  const porColegio =
    !colegio
      ? await prisma.voter.groupBy({
          by: ["dondeVota"],
          where: { ...leaderWhere, ...(mesa ? { mesaVotacion: mesa } : {}) },
          _count: { _all: true },
          orderBy: { _count: { id: "desc" } },
          take: 15
        })
      : [];

  // Distribución por mesa (si hay colegio)
  const porMesa =
    colegio
      ? await prisma.voter.groupBy({
          by: ["mesaVotacion"],
          where: { ...leaderWhere, dondeVota: colegio },
          _count: { _all: true },
          orderBy: [{ _count: { id: "desc" } }, { mesaVotacion: "asc" }]
        })
      : [];

  // Distribución por líder (solo si líder = all)
  let porLider:
    | {
        independentes: number;
        rows: Array<{ label: string; count: number }>;
      }
    | null = null;

  if (leaderFilter.kind === "all") {
    const whereDist: any = {
      ...(colegio ? { dondeVota: colegio } : {}),
      ...(mesa ? { mesaVotacion: mesa } : {})
    };

    const [indCnt, grouped] = await Promise.all([
      prisma.voter.count({ where: { ...whereDist, leaderId: null } }),
      prisma.voter.groupBy({
        by: ["leaderId"],
        where: { ...whereDist, leaderId: { not: null } },
        _count: { _all: true },
        orderBy: { _count: { id: "desc" } }
      })
    ]);

    const ids = grouped.map((g) => g.leaderId!).filter(Boolean);
    const leadersForIds = ids.length
      ? await prisma.leader.findMany({ where: { id: { in: ids } }, select: { id: true, nombresLider: true, apellidosLider: true } })
      : [];

    const map = new Map(leadersForIds.map((l) => [l.id, `${l.nombresLider} ${l.apellidosLider}`]));

    porLider = {
      independentes: indCnt,
      rows: grouped
        .map((g) => ({
          label: map.get(g.leaderId!) || `Líder ${g.leaderId}`,
          count: g._count._all
        }))
        .filter((r) => r.count > 0)
    };
  }

  const currentLeaderValue =
    leaderFilter.kind === "all" ? "all" : leaderFilter.kind === "none" ? "none" : String(leaderFilter.id);

  const exportBase = `/export/filtered`;

  const flash = searchParams.flash ? decodeURIComponent(searchParams.flash) : "";
  const tone =
    searchParams.tone === "success" || searchParams.tone === "warning" || searchParams.tone === "danger"
      ? (searchParams.tone as any)
      : "info";

  // Calcular porcentaje para visualización
  const percentage = totalGeneral > 0 ? Math.round((totalFiltered / totalGeneral) * 100) : 0;

  // Obtener max count para barras
  const maxColegioCount = porColegio.length > 0 ? Math.max(...porColegio.map((r) => r._count._all)) : 1;
  const maxMesaCount = porMesa.length > 0 ? Math.max(...porMesa.map((r) => r._count._all)) : 1;
  const maxLiderCount =
    porLider && porLider.rows.length > 0 ? Math.max(...porLider.rows.map((r) => r.count), porLider.independentes) : 1;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50 to-cyan-50 p-4 md:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header Section */}
        <div className="rounded-xl bg-white/80 p-6 shadow-lg backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-gradient-to-br from-indigo-500 to-cyan-500 p-3">
              <svg className="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-slate-900">
                Filtros
              </h1>
              <p className="text-sm text-slate-600">
                Visualiza y exporta datos filtrados de votantes
              </p>
            </div>
          </div>
        </div>

        {/* Flash Message */}
        {flash && (
          <div className="animate-fade-in">
            <FlashMessage message={flash} tone={tone} />
          </div>
        )}

        {/* Filter Section */}
        <form method="get" className="rounded-xl bg-white/80 p-5 shadow-lg backdrop-blur-sm">
          <div className="space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
              <svg className="h-5 w-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              <h3 className="text-lg font-semibold text-slate-900">Filtros de Búsqueda</h3>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wide text-slate-600">Líder</label>
                <select 
                  name="leader" 
                  defaultValue={currentLeaderValue} 
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm transition-all focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                >
                  <option value="all">Todos los líderes</option>
                  <option value="none">Solo independientes</option>
                  {leaders.map((l) => (
                    <option key={l.id} value={String(l.id)}>
                      {l.nombresLider} {l.apellidosLider}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wide text-slate-600">Colegio</label>
                <select 
                  name="colegio" 
                  defaultValue={colegio} 
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm transition-all focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                >
                  <option value="">Todos</option>
                  {colegios.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wide text-slate-600">Mesa</label>
                <select 
                  name="mesa" 
                  defaultValue={mesa} 
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm transition-all focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                >
                  <option value="">Todas</option>
                  {mesas.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 pt-2">
              <button 
                className="rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition-all hover:bg-indigo-700 hover:shadow-md" 
                type="submit"
              >
                Aplicar Filtros
              </button>
              <Link 
                className="rounded-lg border border-slate-200 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 transition-all hover:bg-slate-50 hover:shadow-md" 
                href="/filtros"
              >
                Limpiar
              </Link>

            </div>
          </div>
        </form>

        {/* KPI Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Total General */}
          <div className="rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 p-6 text-white shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-100">Total General</p>
                <p className="mt-2 text-3xl font-bold">{totalGeneral.toLocaleString()}</p>
              </div>
              <div className="rounded-full bg-white/20 p-3">
                <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
            </div>
            <div className="mt-3 text-xs text-blue-100">Votantes registrados</div>
          </div>

          {/* Total Filtrado */}
          <div className="rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 p-6 text-white shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-indigo-100">Total Filtrado</p>
                <p className="mt-2 text-3xl font-bold">{totalFiltered.toLocaleString()}</p>
              </div>
              <div className="rounded-full bg-white/20 p-3">
                <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
              </div>
            </div>
            <div className="mt-3 text-xs text-indigo-100">Resultados actuales</div>
          </div>

          {/* Porcentaje */}
          <div className="rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 p-6 text-white shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-100">Porcentaje</p>
                <p className="mt-2 text-3xl font-bold">{percentage}%</p>
              </div>
              <div className="rounded-full bg-white/20 p-3">
                <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
            </div>
            <div className="mt-3 text-xs text-purple-100">Del total general</div>
          </div>

          {/* Total Colegio (si aplica) */}
          {colegio ? (
            <div className="rounded-xl bg-gradient-to-br from-cyan-500 to-cyan-600 p-6 text-white shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-cyan-100">En Colegio</p>
                  <p className="mt-2 text-3xl font-bold">{totalColegio?.toLocaleString() ?? 0}</p>
                </div>
                <div className="rounded-full bg-white/20 p-3">
                  <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
              </div>
              <div className="mt-3 truncate text-xs text-cyan-100">{colegio}</div>
            </div>
          ) : (
            <div className="rounded-xl bg-gradient-to-br from-cyan-500 to-cyan-600 p-6 text-white shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-cyan-100">Colegios</p>
                  <p className="mt-2 text-3xl font-bold">{colegios.length}</p>
                </div>
                <div className="rounded-full bg-white/20 p-3">
                  <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
              </div>
              <div className="mt-3 text-xs text-cyan-100">Puestos de votación</div>
            </div>
          )}
        </div>

        {/* Charts Section */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Distribución por Colegio o Mesa */}
          <div className="rounded-xl bg-white/80 p-6 shadow-lg backdrop-blur-sm">
            <div className="mb-4 flex items-center gap-2 border-b border-slate-200 pb-3">
              <div className="rounded-lg bg-indigo-100 p-2">
                <svg className="h-5 w-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-slate-900">
                {!colegio ? "Por Colegio (Top 15)" : `Por Mesa (${colegio})`}
              </h3>
            </div>

            <div className="space-y-3">
              {!colegio ? (
                porColegio.length > 0 ? (
                  porColegio.map((r, idx) => {
                    const width = (r._count._all / maxColegioCount) * 100;
                    return (
                      <div key={r.dondeVota || idx} className="group">
                        <div className="mb-1 flex items-center justify-between text-sm">
                          <span className="truncate font-medium text-slate-700">
                            {r.dondeVota || "(Sin colegio)"}
                          </span>
                          <span className="ml-2 font-bold text-indigo-600">{r._count._all}</span>
                        </div>
                        <div className="h-3 w-full overflow-hidden rounded-full bg-slate-100">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-indigo-600 transition-all duration-500 ease-out"
                            style={{ width: `${width}%` }}
                          />
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="py-8 text-center text-sm text-slate-500">Sin datos disponibles</div>
                )
              ) : porMesa.length > 0 ? (
                porMesa.map((r, idx) => {
                  const width = (r._count._all / maxMesaCount) * 100;
                  return (
                    <div key={r.mesaVotacion || idx} className="group">
                      <div className="mb-1 flex items-center justify-between text-sm">
                        <span className="font-medium text-slate-700">
                          Mesa {r.mesaVotacion || "(Sin mesa)"}
                        </span>
                        <span className="ml-2 font-bold text-indigo-600">{r._count._all}</span>
                      </div>
                      <div className="h-3 w-full overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-indigo-600 transition-all duration-500 ease-out"
                          style={{ width: `${width}%` }}
                        />
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="py-8 text-center text-sm text-slate-500">Sin datos disponibles</div>
              )}
            </div>
          </div>

          {/* Distribución por Líder */}
          <div className="rounded-xl bg-white/80 p-6 shadow-lg backdrop-blur-sm">
            <div className="mb-4 flex items-center gap-2 border-b border-slate-200 pb-3">
              <div className="rounded-lg bg-purple-100 p-2">
                <svg className="h-5 w-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-slate-900">Por Líder</h3>
            </div>

            {leaderFilter.kind !== "all" ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="rounded-full bg-slate-100 p-4">
                  <svg className="h-12 w-12 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="mt-3 text-sm text-slate-600">
                  Selecciona "Todos los líderes" para ver esta distribución
                </p>
              </div>
            ) : porLider ? (
              <div className="space-y-3">
                {/* Independientes */}
                <div className="group">
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2 font-medium text-slate-700">
                      <svg className="h-4 w-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7a4 4 0 11-8 0 4 4 0 018 0zM9 14a6 6 0 00-6 6v1h12v-1a6 6 0 00-6-6z" />
                      </svg>
                      Independientes
                    </span>
                    <span className="ml-2 font-bold text-purple-600">{porLider.independentes}</span>
                  </div>
                  <div className="h-3 w-full overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-slate-400 to-slate-500 transition-all duration-500 ease-out"
                      style={{ width: `${(porLider.independentes / maxLiderCount) * 100}%` }}
                    />
                  </div>
                </div>

                {/* Líderes */}
                {porLider.rows.slice(0, 10).map((r, idx) => {
                  const width = (r.count / maxLiderCount) * 100;
                  return (
                    <div key={idx} className="group">
                      <div className="mb-1 flex items-center justify-between text-sm">
                        <span className="truncate font-medium text-slate-700">{r.label}</span>
                        <span className="ml-2 font-bold text-purple-600">{r.count}</span>
                      </div>
                      <div className="h-3 w-full overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-purple-500 to-purple-600 transition-all duration-500 ease-out"
                          style={{ width: `${width}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
                {porLider.rows.length === 0 && (
                  <div className="py-8 text-center text-sm text-slate-500">Sin líderes con votantes</div>
                )}
              </div>
            ) : null}
          </div>
        </div>

        {/* Data Table */}
        <div className="rounded-xl bg-white/80 shadow-lg backdrop-blur-sm">
          <div className="border-b border-slate-200 bg-gradient-to-r from-slate-50 to-slate-100 p-5 rounded-t-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="rounded-lg bg-slate-700 p-2">
                  <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Listado de Votantes</h3>
                  <p className="text-xs text-slate-600">Mostrando {Math.min(voters.length, 500)} de {totalFiltered} registros</p>
                </div>
              </div>
              {truncated && (
                <div className="flex items-center gap-2 rounded-lg bg-amber-50 px-3 py-2 text-xs font-medium text-amber-700">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  Tabla limitada a 500 filas
                </div>
              )}
            </div>
          </div>

          <div className="p-5">
            <div className="overflow-x-auto rounded-lg border border-slate-200">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">
                  <tr>
                    <th className="px-4 py-3">Cédula</th>
                    <th className="px-4 py-3">Nombre</th>
                    <th className="px-4 py-3">Colegio</th>
                    <th className="px-4 py-3">Mesa</th>
                    <th className="px-4 py-3">Líder</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {voters.map((v) => (
                    <tr key={v.id} className="transition-colors hover:bg-slate-50">
                      <td className="px-4 py-3">
                        <span className="font-mono text-slate-900">{v.cedulaVotante}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-medium text-slate-900">
                          {v.apellidos}, {v.nombres}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-600">{v.dondeVota ?? "—"}</td>
                      <td className="px-4 py-3">
                        {v.mesaVotacion ? (
                          <span className="inline-flex items-center rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-semibold text-indigo-700">
                            {v.mesaVotacion}
                          </span>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {v.leader ? (
                          <Link 
                            className="inline-flex items-center gap-1 font-medium text-purple-600 hover:text-purple-700 hover:underline" 
                            href={`/leaders/${v.leader.id}`}
                          >
                            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                            {v.leader.nombresLider} {v.leader.apellidosLider}
                          </Link>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-slate-500">
                            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7a4 4 0 11-8 0 4 4 0 018 0zM9 14a6 6 0 00-6 6v1h12v-1a6 6 0 00-6-6z" />
                            </svg>
                            Independiente
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {voters.length === 0 && (
                    <tr>
                      <td className="px-4 py-12 text-center text-sm text-slate-500" colSpan={5}>
                        <div className="flex flex-col items-center gap-2">
                          <svg className="h-12 w-12 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                          </svg>
                          <p className="font-medium">No hay registros con los filtros aplicados</p>
                          <p className="text-xs">Intenta ajustar los filtros de búsqueda</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {truncated && (
              <div className="mt-4 rounded-lg bg-amber-50 p-4">
                <div className="flex gap-3">
                  <svg className="h-5 w-5 flex-shrink-0 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <div>
                    <p className="text-sm font-medium text-amber-900">
                      El listado está limitado a 500 filas por rendimiento
                    </p>
                    <p className="mt-1 text-xs text-amber-700">
                      Para ver todos los {totalFiltered.toLocaleString()} registros, exporta los datos usando los botones de Excel o CSV.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}