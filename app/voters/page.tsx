import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/require-auth";
import { normalizeText } from "@/lib/normalize";
import { FlashMessage } from "@/components/FlashMessage";
import { toggleVoterCheckInAction } from "@/app/actions/voters";
import { formatDateTimeCO } from "@/lib/time";

function parseLeaderFilter(v: string | undefined): { kind: "all" } | { kind: "none" } | { kind: "id"; id: number } {
  const s = (v || "all").trim();
  if (s === "" || s === "all") return { kind: "all" };
  if (s === "none") return { kind: "none" };
  const id = Number(s);
  if (Number.isFinite(id) && id > 0) return { kind: "id", id };
  return { kind: "all" };
}

export default async function VotersPage({
  searchParams
}: {
  searchParams: { q?: string; leader?: string; colegio?: string; mesa?: string; flash?: string; tone?: string };
}) {
  await requireAuth();

  const q = (searchParams.q || "").trim();
  const qNorm = q ? normalizeText(q) : "";
  const leaderFilter = parseLeaderFilter(searchParams.leader);
  const colegio = (searchParams.colegio || "").trim();
  const mesa = (searchParams.mesa || "").trim();

  const leaderWhere =
    leaderFilter.kind === "none"
      ? { leaderId: null as any }
      : leaderFilter.kind === "id"
        ? { leaderId: leaderFilter.id }
        : {};

  const whereBase: any = {
    ...leaderWhere,
    ...(colegio ? { dondeVota: colegio } : {}),
    ...(mesa ? { mesaVotacion: mesa } : {}),
    ...(qNorm
      ? {
          OR: [
            { cedulaNorm: { contains: qNorm } },
            { nombresNorm: { contains: qNorm } },
            { apellidosNorm: { contains: qNorm } },
            { dondeVotaNorm: { contains: qNorm } },
            { mesaVotacionNorm: { contains: qNorm } },
            {
              leader: {
                OR: [{ nombresNorm: { contains: qNorm } }, { apellidosNorm: { contains: qNorm } }, { cedulaNorm: { contains: qNorm } }]
              }
            }
          ]
        }
      : {})
  };

  const [leaders, colegiosRows, votersPending, votersChecked] = await Promise.all([
    prisma.leader.findMany({ orderBy: [{ apellidosLider: "asc" }, { nombresLider: "asc" }], select: { id: true, nombresLider: true, apellidosLider: true } }),
    prisma.voter.findMany({
      where: { dondeVota: { not: null }, NOT: { dondeVota: "" } },
      distinct: ["dondeVota"],
      select: { dondeVota: true },
      orderBy: { dondeVota: "asc" }
    }),
    prisma.voter.findMany({
      where: { ...whereBase, checkedIn: false },
      include: { leader: { select: { id: true, nombresLider: true, apellidosLider: true } } },
      orderBy: [{ apellidos: "asc" }, { nombres: "asc" }]
    }),
    prisma.voter.findMany({
      where: { ...whereBase, checkedIn: true },
      include: { leader: { select: { id: true, nombresLider: true, apellidosLider: true } } },
      orderBy: [{ checkedInAt: "desc" }]
    })
  ]);

  const colegios = colegiosRows.map((r) => r.dondeVota!).filter(Boolean);

  const flash = searchParams.flash ? decodeURIComponent(searchParams.flash) : "";
  const tone =
    searchParams.tone === "success" || searchParams.tone === "warning" || searchParams.tone === "danger"
      ? (searchParams.tone as any)
      : "info";

  const currentLeaderValue =
    leaderFilter.kind === "all" ? "all" : leaderFilter.kind === "none" ? "none" : String(leaderFilter.id);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-pink-50 p-4 md:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header Section */}
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl bg-white/80 p-6 shadow-lg backdrop-blur-sm">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">
              Gestión de Votantes
            </h1>
            <p className="text-sm text-slate-600">
              Controla la asistencia de votantes en tiempo real
            </p>
          </div>
          <Link 
            href="/voters/new" 
            className="group inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md transition-all hover:shadow-lg hover:scale-105"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Nuevo votante
          </Link>
        </div>

        {/* Flash Message */}
        {flash && (
          <div className="animate-fade-in">
            <FlashMessage message={flash} tone={tone} />
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 p-6 text-white shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-100">Por confirmar</p>
                <p className="mt-1 text-3xl font-bold">{votersPending.length}</p>
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
                <p className="mt-1 text-3xl font-bold">{votersChecked.length}</p>
              </div>
              <div className="rounded-full bg-white/20 p-3">
                <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filter Section */}
        <form 
          className="rounded-xl bg-white/80 p-5 shadow-lg backdrop-blur-sm transition-all hover:shadow-xl" 
          method="get"
        >
          <div className="space-y-4">
            {/* First Row - Main Search */}
            <div className="relative">
              <svg 
                className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                name="q"
                defaultValue={q}
                placeholder="Buscar por cédula, nombre, líder, colegio..."
                className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm transition-all focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
              />
            </div>

            {/* Second Row - Filters */}
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-600">Líder</label>
                <select 
                  name="leader" 
                  defaultValue={currentLeaderValue} 
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm transition-all focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                >
                  <option value="all">Todos (con o sin líder)</option>
                  <option value="none">Solo independientes</option>
                  {leaders.map((l) => (
                    <option key={l.id} value={String(l.id)}>
                      {l.nombresLider} {l.apellidosLider}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-600">Colegio</label>
                <select 
                  name="colegio" 
                  defaultValue={colegio} 
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm transition-all focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                >
                  <option value="">Todos los colegios</option>
                  {colegios.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-600">Mesa</label>
                <input
                  name="mesa"
                  defaultValue={mesa}
                  placeholder="Número de mesa"
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm transition-all focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                />
              </div>

              <div className="flex items-end gap-2">
                <button 
                  className="flex-1 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition-all hover:bg-slate-800 hover:shadow-md" 
                  type="submit"
                >
                  Filtrar
                </button>
              </div>
            </div>

            {/* Third Row - Action Buttons */}
            <div className="flex flex-wrap gap-2">
              <Link 
                className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-all hover:bg-slate-50 hover:shadow-md" 
                href="/voters"
              >
                Limpiar filtros
              </Link>
              <Link
                className="rounded-lg border border-purple-200 bg-purple-50 px-4 py-2 text-sm font-medium text-purple-700 transition-all hover:bg-purple-100 hover:shadow-md"
                href={`/filtros?leader=${encodeURIComponent(currentLeaderValue)}&colegio=${encodeURIComponent(colegio)}&mesa=${encodeURIComponent(mesa)}`}
              >
                <span className="inline-flex items-center gap-1">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                  </svg>
                  Ver en Filtros
                </span>
              </Link>
            </div>
          </div>
        </form>

        {/* Pending Voters Section */}
        <section className="rounded-xl bg-white/80 shadow-lg backdrop-blur-sm">
          <div className="border-b border-slate-200 bg-gradient-to-r from-amber-50 to-orange-50 p-5 rounded-t-xl">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-amber-500 p-2">
                <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900">Por confirmar</h2>
                <p className="text-xs text-slate-600">Marca con ✓ cuando el votante llegue</p>
              </div>
            </div>
          </div>

          <div className="p-5">
            <div className="overflow-x-auto rounded-lg border border-slate-200">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">
                  <tr>
                    <th className="px-4 py-3">Cédula</th>
                    <th className="px-4 py-3">Nombre</th>
                    <th className="px-4 py-3">Puesto</th>
                    <th className="px-4 py-3">Mesa</th>
                    <th className="px-4 py-3">Líder</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {votersPending.map((v) => (
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
                          <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700">
                            Mesa {v.mesaVotacion}
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
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-2">
                          <Link 
                            className="rounded-md bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-700 transition-all hover:bg-slate-200" 
                            href={`/voters/${v.id}/edit`}
                          >
                            Editar
                          </Link>
                          <form action={toggleVoterCheckInAction.bind(null, v.id)}>
                            <button 
                              className="rounded-md bg-green-500 px-3 py-1.5 text-xs font-medium text-white transition-all hover:bg-green-600 hover:shadow-md" 
                              type="submit" 
                              title="Confirmar"
                            >
                              ✓
                            </button>
                          </form>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {votersPending.length === 0 && (
                    <tr>
                      <td className="px-4 py-8 text-center text-sm text-slate-500" colSpan={6}>
                        <div className="flex flex-col items-center gap-2">
                          <svg className="h-12 w-12 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                          </svg>
                          <p className="font-medium">No hay votantes pendientes</p>
                          {(q || leaderFilter.kind !== "all" || colegio || mesa) && (
                            <p className="text-xs">Intenta con otro filtro</p>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Checked Voters Section */}
        <section className="rounded-xl bg-white/80 shadow-lg backdrop-blur-sm">
          <div className="border-b border-slate-200 bg-gradient-to-r from-green-50 to-emerald-50 p-5 rounded-t-xl">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-green-500 p-2">
                <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900">Votantes confirmados</h2>
                <p className="text-xs text-slate-600">Si te equivocaste, desmarca con ↩</p>
              </div>
            </div>
          </div>

          <div className="p-5">
            <div className="overflow-x-auto rounded-lg border border-slate-200">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">
                  <tr>
                    <th className="px-4 py-3">Cédula</th>
                    <th className="px-4 py-3">Nombre</th>
                    <th className="px-4 py-3">Puesto</th>
                    <th className="px-4 py-3">Mesa</th>
                    <th className="px-4 py-3">Líder</th>
                    <th className="px-4 py-3">Hora</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {votersChecked.map((v) => (
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
                          <span className="inline-flex items-center rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-semibold text-green-700">
                            Mesa {v.mesaVotacion}
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
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1 text-xs text-slate-500">
                          <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          {formatDateTimeCO(v.checkedInAt)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <form action={toggleVoterCheckInAction.bind(null, v.id)} className="flex justify-end">
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
                  {votersChecked.length === 0 && (
                    <tr>
                      <td className="px-4 py-8 text-center text-sm text-slate-500" colSpan={7}>
                        <div className="flex flex-col items-center gap-2">
                          <svg className="h-12 w-12 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                          </svg>
                          <p className="font-medium">Aún no hay votantes confirmados</p>
                          <p className="text-xs">Marca a los votantes cuando lleguen</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}