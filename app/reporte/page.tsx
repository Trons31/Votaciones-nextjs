import Link from "next/link";
import { requireAuth } from "@/lib/require-auth";
import { prisma } from "@/lib/prisma";
import { formatDateTimeCO } from "@/lib/time";
import { FlashMessage } from "@/components/FlashMessage";

export default async function ReportePage({
  searchParams
}: {
  searchParams: { flash?: string; tone?: string };
}) {
  await requireAuth();

  const generatedAt = new Date();

 const [
  totalVoters,
  totalLeaders,
  totalIndependientes,
  votersPrecargados,
  votersNuevos,
  leadersPrecargados,
  leadersNuevos,
  votersConfirmados,
  leadersConfirmados,
  porColegio,
  porMesa,
  leaders,
  groupedByLeader
] = await Promise.all([
  prisma.voter.count(),
  prisma.leader.count(),
  prisma.voter.count({ where: { leaderId: null } }),
  prisma.voter.count({ where: { origen: "precargado" } }),
  prisma.voter.count({ where: { origen: "nuevo" } }),
  prisma.leader.count({ where: { origen: "precargado" } }),
  prisma.leader.count({ where: { origen: "nuevo" } }),
  prisma.voter.count({ where: { checkedIn: true } }),
  prisma.leader.count({ where: { checkedIn: true } }),
  prisma.voter.groupBy({
    by: ["dondeVota"],
    where: { dondeVota: { not: null }, NOT: { dondeVota: "" } },
    _count: { _all: true },
    orderBy: { _count: { id: "desc" } }
  }),
  prisma.voter.groupBy({
    by: ["dondeVota", "mesaVotacion"],
    where: {
      dondeVota: { not: null },
      mesaVotacion: { not: null },
      NOT: [{ dondeVota: "" }, { mesaVotacion: "" }]
    },
    _count: { _all: true },
    orderBy: [{ _count: { id: "desc" } }, { dondeVota: "asc" }, { mesaVotacion: "asc" }]
  }),
  prisma.leader.findMany({
    orderBy: [{ apellidosLider: "asc" }, { nombresLider: "asc" }],
    select: { id: true, nombresLider: true, apellidosLider: true }
  }),
  prisma.voter.groupBy({
    by: ["leaderId"],
    where: { leaderId: { not: null } },
    _count: { _all: true }
  })
]);

  const countMap = new Map<number, number>();
  for (const g of groupedByLeader) {
    if (g.leaderId) countMap.set(g.leaderId, g._count._all);
  }

  const porLiderRows: Array<{ lider: string; count: number; isIndependiente?: boolean }> = [
  { lider: "Independientes (sin líder)", count: totalIndependientes, isIndependiente: true },
  ...leaders.map((l) => ({
    lider: `${l.nombresLider} ${l.apellidosLider}`,
    count: countMap.get(l.id) ?? 0
  }))
]
  .filter((r) => r.count > 0)
  .sort((a, b) => b.count - a.count);

  const flash = searchParams.flash ? decodeURIComponent(searchParams.flash) : "";
  const tone =
    searchParams.tone === "success" || searchParams.tone === "warning" || searchParams.tone === "danger"
      ? (searchParams.tone as any)
      : "info";

  // Calcular porcentajes
  const porcentajeConfirmados = totalVoters > 0 ? Math.round((votersConfirmados / totalVoters) * 100) : 0;
  const porcentajeLideresConfirmados = totalLeaders > 0 ? Math.round((leadersConfirmados / totalLeaders) * 100) : 0;
  const porcentajeIndependientes = totalVoters > 0 ? Math.round((totalIndependientes / totalVoters) * 100) : 0;

  // Max counts para barras
  const maxColegioCount = porColegio.length > 0 ? Math.max(...porColegio.map((r) => r._count._all)) : 1;
  const maxLiderCount = porLiderRows.length > 0 ? Math.max(...porLiderRows.map((r) => r.count)) : 1;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-orange-50 to-red-50 p-4 md:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header Section */}
        <div className="rounded-xl bg-white/80 p-6 shadow-lg backdrop-blur-sm">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-gradient-to-br from-orange-500 to-red-500 p-3">
                <svg className="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <h1 className="text-3xl font-bold tracking-tight text-slate-900">
                  Reporte General
                </h1>
                <p className="text-sm text-slate-600">
                  Resumen completo del sistema
                </p>
              </div>
            </div>
          
          </div>
          
          {/* Timestamp */}
          <div className="mt-4 flex items-center gap-2 rounded-lg bg-slate-50 px-4 py-2 text-sm text-slate-600">
            <svg className="h-4 w-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Generado el {formatDateTimeCO(generatedAt)}</span>
          </div>
        </div>

        {/* Flash Message */}
        {flash && (
          <div className="animate-fade-in">
            <FlashMessage message={flash} tone={tone} />
          </div>
        )}

        {/* Main KPI Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Total Votantes */}
          <div className="rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 p-6 text-white shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-100">Total Votantes</p>
                <p className="mt-2 text-3xl font-bold">{totalVoters.toLocaleString()}</p>
              </div>
              <div className="rounded-full bg-white/20 p-3">
                <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
            </div>
            <div className="mt-3 flex items-center gap-2 text-xs text-blue-100">
              <span className="rounded-full bg-white/20 px-2 py-0.5">
               {votersPrecargados} precargados
              </span>
              <span className="rounded-full bg-white/20 px-2 py-0.5">
                {votersNuevos} nuevos
              </span>
            </div>
          </div>

          {/* Total Líderes */}
          <div className="rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 p-6 text-white shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-100">Total Líderes</p>
                <p className="mt-2 text-3xl font-bold">{totalLeaders.toLocaleString()}</p>
              </div>
              <div className="rounded-full bg-white/20 p-3">
                <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
            </div>
                <div className="mt-3 flex items-center gap-2 text-xs text-purple-100">
        <span className="rounded-full bg-white/20 px-2 py-0.5">
          {leadersPrecargados} precargados
        </span>
        <span className="rounded-full bg-white/20 px-2 py-0.5">
          {leadersNuevos} nuevos
        </span>
      </div>
          </div>

          {/* Votantes Confirmados */}
          <div className="rounded-xl bg-gradient-to-br from-green-500 to-green-600 p-6 text-white shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-100">Votantes Confirmados</p>
                <p className="mt-2 text-3xl font-bold">{votersConfirmados.toLocaleString()}</p>
              </div>
              <div className="rounded-full bg-white/20 p-3">
                <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <div className="mt-3">
              <div className="flex items-center justify-between text-xs text-green-100">
                <span>Asistencia</span>
                <span className="font-semibold">{porcentajeConfirmados}%</span>
              </div>
              <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-white/20">
                <div 
                  className="h-full rounded-full bg-white transition-all duration-1000" 
                  style={{ width: `${porcentajeConfirmados}%` }}
                />
              </div>
            </div>
          </div>

          {/* Líderes Confirmados */}
          <div className="rounded-xl bg-gradient-to-br from-orange-500 to-red-500 p-6 text-white shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-100">Líderes Confirmados</p>
                <p className="mt-2 text-3xl font-bold">{leadersConfirmados.toLocaleString()}</p>
              </div>
              <div className="rounded-full bg-white/20 p-3">
                <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
            <div className="mt-3">
              <div className="flex items-center justify-between text-xs text-orange-100">
                <span>Llegada</span>
                <span className="font-semibold">{porcentajeLideresConfirmados}%</span>
              </div>
              <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-white/20">
                <div 
                  className="h-full rounded-full bg-white transition-all duration-1000" 
                  style={{ width: `${porcentajeLideresConfirmados}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Distribución por Colegio */}
          <div className="rounded-xl bg-white/80 p-6 shadow-lg backdrop-blur-sm">
            <div className="mb-4 flex items-center gap-2 border-b border-slate-200 pb-3">
              <div className="rounded-lg bg-orange-100 p-2">
                <svg className="h-5 w-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Distribución por Colegio</h3>
                <p className="text-xs text-slate-600">{porColegio.length} puestos de votación</p>
              </div>
            </div>

            <div className="max-h-96 space-y-3 overflow-y-auto pr-2">
              {porColegio.length > 0 ? (
                porColegio.map((r, idx) => {
                  const width = (r._count._all / maxColegioCount) * 100;
                  const porcentaje = totalVoters > 0 ? Math.round((r._count._all / totalVoters) * 100) : 0;
                  return (
                    <div key={r.dondeVota || idx} className="group">
                      <div className="mb-1 flex items-center justify-between text-sm">
                        <span className="truncate font-medium text-slate-700">
                          {r.dondeVota || "(Sin colegio)"}
                        </span>
                        <div className="ml-2 flex items-center gap-2">
                          <span className="text-xs text-slate-500">{porcentaje}%</span>
                          <span className="font-bold text-orange-600">{r._count._all}</span>
                        </div>
                      </div>
                      <div className="h-3 w-full overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-orange-500 to-red-500 transition-all duration-500 ease-out"
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
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Distribución por Líder</h3>
                <p className="text-xs text-slate-600">{porLiderRows.length} categorías</p>
              </div>
            </div>

            <div className="max-h-96 space-y-3 overflow-y-auto pr-2">
              {porLiderRows.length > 0 ? (
                porLiderRows.map((r, idx) => {
                  const width = (r.count / maxLiderCount) * 100;
                  const porcentaje = totalVoters > 0 ? Math.round((r.count / totalVoters) * 100) : 0;
                  return (
                    <div key={idx} className="group">
                      <div className="mb-1 flex items-center justify-between text-sm">
                        <span className="flex items-center gap-2 truncate font-medium text-slate-700">
                          {r.isIndependiente && (
                            <svg className="h-4 w-4 flex-shrink-0 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7a4 4 0 11-8 0 4 4 0 018 0zM9 14a6 6 0 00-6 6v1h12v-1a6 6 0 00-6-6z" />
                            </svg>
                          )}
                          {r.lider}
                        </span>
                        <div className="ml-2 flex items-center gap-2">
                          <span className="text-xs text-slate-500">{porcentaje}%</span>
                          <span className="font-bold text-purple-600">{r.count}</span>
                        </div>
                      </div>
                      <div className="h-3 w-full overflow-hidden rounded-full bg-slate-100">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ease-out ${
                            r.isIndependiente 
                              ? "bg-gradient-to-r from-slate-400 to-slate-500" 
                              : "bg-gradient-to-r from-purple-500 to-purple-600"
                          }`}
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
        </div>

        {/* Mesa Details Table */}
        <div className="rounded-xl bg-white/80 shadow-lg backdrop-blur-sm">
          <div className="border-b border-slate-200 bg-gradient-to-r from-slate-50 to-slate-100 p-5 rounded-t-xl">
            <div className="flex items-center gap-2">
              <div className="rounded-lg bg-slate-700 p-2">
                <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Detalle por Mesa</h3>
                <p className="text-xs text-slate-600">Distribución completa por colegio y mesa</p>
              </div>
            </div>
          </div>

          <div className="p-5">
            <div className="overflow-x-auto rounded-lg border border-slate-200">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">
                  <tr>
                    <th className="px-4 py-3">Colegio</th>
                    <th className="px-4 py-3">Mesa</th>
                    <th className="px-4 py-3 text-right">Cantidad</th>
                    <th className="px-4 py-3 text-right">% del Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {porMesa.map((r, idx) => {
                    const porcentaje = totalVoters > 0 ? ((r._count._all / totalVoters) * 100).toFixed(1) : "0.0";
                    return (
                      <tr key={`${r.dondeVota}|${r.mesaVotacion}`} className="transition-colors hover:bg-slate-50">
                        <td className="px-4 py-3 font-medium text-slate-900">{r.dondeVota}</td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center rounded-full bg-orange-50 px-2.5 py-0.5 text-xs font-semibold text-orange-700">
                            Mesa {r.mesaVotacion}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right font-bold text-slate-900">{r._count._all}</td>
                        <td className="px-4 py-3 text-right text-slate-600">{porcentaje}%</td>
                      </tr>
                    );
                  })}
                  {porMesa.length === 0 && (
                    <tr>
                      <td className="px-4 py-12 text-center text-sm text-slate-500" colSpan={4}>
                        <div className="flex flex-col items-center gap-2">
                          <svg className="h-12 w-12 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                          </svg>
                          <p className="font-medium">No hay datos de mesas</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}