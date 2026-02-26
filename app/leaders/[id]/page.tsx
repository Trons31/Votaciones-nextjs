import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/require-auth";
import { FlashMessage } from "@/components/FlashMessage";
import { formatDateTimeCO } from "@/lib/time";
import { deleteLeaderAction, toggleLeaderCheckInAction } from "@/app/actions/leaders";
import { toggleVoterCheckInAction } from "@/app/actions/voters";
import { DeleteLeaderButton } from "@/components/DeleteLeaderButton";

export default async function LeaderDetailPage({
  params,
  searchParams
}: {
  params: { id: string };
  searchParams: { flash?: string; tone?: string };
}) {
  await requireAuth();

  const id = Number(params.id);
  if (!Number.isFinite(id)) notFound();

  const leader = await prisma.leader.findUnique({
    where: { id },
    include: {
      voters: {
        include: { leader: { select: { id: true, nombresLider: true, apellidosLider: true } } },
        orderBy: [{ apellidos: "asc" }, { nombres: "asc" }]
      }
    }
  });

  if (!leader) notFound();

  const flash = searchParams.flash ? decodeURIComponent(searchParams.flash) : "";
  const tone =
    searchParams.tone === "success" || searchParams.tone === "warning" || searchParams.tone === "danger"
      ? (searchParams.tone as any)
      : "info";

  const exportBase = `/export/leader/${leader.id}`;

  // Calcular estadísticas
  const totalVoters = leader.voters.length;
  const confirmedVoters = leader.voters.filter(v => v.checkedIn).length;
  const pendingVoters = totalVoters - confirmedVoters;
  const confirmationRate = totalVoters > 0 ? Math.round((confirmedVoters / totalVoters) * 100) : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-violet-50 to-purple-50 p-4 md:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <Link href="/leaders" className="hover:text-slate-900">
            Líderes
          </Link>
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <span className="font-medium text-slate-900">Detalle del líder</span>
        </div>

        {/* Flash Message */}
        {flash && (
          <div className="animate-fade-in">
            <FlashMessage message={flash} tone={tone} />
          </div>
        )}

        {/* Header Card */}
        <div className="rounded-xl bg-white/80 p-6 shadow-lg backdrop-blur-sm">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex gap-4">
              {/* Avatar */}
              <div className="flex h-20 w-20 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 text-3xl font-bold text-white shadow-lg">
                {leader.nombresLider.charAt(0)}{leader.apellidosLider.charAt(0)}
              </div>

              {/* Info */}
              <div>
                <h1 className="text-3xl font-bold text-slate-900">
                  {leader.nombresLider} {leader.apellidosLider}
                </h1>
                
                {/* Info badges */}
                <div className="mt-3 flex flex-wrap gap-2">
                  {leader.cedulaLider && (
                    <div className="inline-flex items-center gap-1.5 rounded-lg bg-blue-50 px-3 py-1.5 text-sm">
                      <svg className="h-4 w-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
                      </svg>
                      <span className="font-medium text-blue-700">{leader.cedulaLider}</span>
                    </div>
                  )}
                  
                  {leader.telefono && (
                    <div className="inline-flex items-center gap-1.5 rounded-lg bg-green-50 px-3 py-1.5 text-sm">
                      <svg className="h-4 w-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                      <span className="font-medium text-green-700">{leader.telefono}</span>
                    </div>
                  )}
                  
                  {leader.zonaBarrio && (
                    <div className="inline-flex items-center gap-1.5 rounded-lg bg-amber-50 px-3 py-1.5 text-sm">
                      <svg className="h-4 w-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span className="font-medium text-amber-700">{leader.zonaBarrio}</span>
                    </div>
                  )}
                </div>

                {/* Status Badge */}
                <div className="mt-3">
                  {leader.checkedIn ? (
                    <div className="inline-flex items-center gap-2 rounded-lg bg-green-100 px-3 py-2 text-sm">
                      <div className="h-2 w-2 rounded-full bg-green-600 animate-pulse"></div>
                      <span className="font-semibold text-green-800">Confirmado</span>
                      <span className="text-green-700">• {formatDateTimeCO(leader.checkedInAt)}</span>
                    </div>
                  ) : (
                    <div className="inline-flex items-center gap-2 rounded-lg bg-amber-100 px-3 py-2 text-sm">
                      <div className="h-2 w-2 rounded-full bg-amber-600"></div>
                      <span className="font-semibold text-amber-800">Pendiente de confirmación</span>
                    </div>
                  )}
                </div>

                {/* Notes */}
                {leader.notas && (
                  <div className="mt-3 rounded-lg bg-slate-50 p-3 text-sm text-slate-700">
                    <div className="flex items-start gap-2">
                      <svg className="h-4 w-4 flex-shrink-0 text-slate-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                      </svg>
                      <span>{leader.notas}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-2">
              <Link 
                className="inline-flex items-center gap-2 rounded-lg bg-slate-100 px-4 py-2.5 text-sm font-medium text-slate-700 transition-all hover:bg-slate-200" 
                href={`/leaders/${leader.id}/edit`}
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Editar
              </Link>

              <form action={toggleLeaderCheckInAction.bind(null, leader.id)}>
                <button 
                  className={`inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all ${
                    leader.checkedIn 
                      ? "bg-amber-100 text-amber-700 hover:bg-amber-200" 
                      : "bg-green-500 text-white hover:bg-green-600 shadow-md"
                  }`}
                  type="submit"
                >
                  {leader.checkedIn ? (
                    <>
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                      </svg>
                      Desmarcar
                    </>
                  ) : (
                    <>
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Marcar llegada
                    </>
                  )}
                </button>
              </form>

                      <Link
          className="inline-flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2.5 text-sm font-medium text-white transition-all hover:bg-violet-700 shadow-md"
          href={`/voters/new?leader=${leader.id}`}
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M18 9v3m0 0v3m0-3h3m-3 0h-3M11 11a4 4 0 100-8 4 4 0 000 8zm-7 10a7 7 0 0114 0v1H4v-1z"
            />
          </svg>
          Agregar votante del lider
        </Link>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Total Votantes */}
          <div className="rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 p-6 text-white shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-100">Total Votantes</p>
                <p className="mt-2 text-3xl font-bold">{totalVoters}</p>
              </div>
              <div className="rounded-full bg-white/20 p-3">
                <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
            </div>
            <div className="mt-3 text-xs text-blue-100">Asignados a este líder</div>
          </div>

          {/* Confirmados */}
          <div className="rounded-xl bg-gradient-to-br from-green-500 to-green-600 p-6 text-white shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-100">Confirmados</p>
                <p className="mt-2 text-3xl font-bold">{confirmedVoters}</p>
              </div>
              <div className="rounded-full bg-white/20 p-3">
                <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <div className="mt-3 text-xs text-green-100">Han llegado a votar</div>
          </div>

          {/* Pendientes */}
          <div className="rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 p-6 text-white shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-100">Pendientes</p>
                <p className="mt-2 text-3xl font-bold">{pendingVoters}</p>
              </div>
              <div className="rounded-full bg-white/20 p-3">
                <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <div className="mt-3 text-xs text-orange-100">Aún no confirmados</div>
          </div>

          {/* Tasa de Confirmación */}
          <div className="rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 p-6 text-white shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-100">Tasa</p>
                <p className="mt-2 text-3xl font-bold">{confirmationRate}%</p>
              </div>
              <div className="rounded-full bg-white/20 p-3">
                <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
            </div>
            <div className="mt-3">
              <div className="flex items-center justify-between text-xs text-purple-100">
                <span>Confirmación</span>
              </div>
              <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-white/20">
                <div 
                  className="h-full rounded-full bg-white transition-all duration-1000" 
                  style={{ width: `${confirmationRate}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Voters Table */}
        <div className="rounded-xl bg-white/80 shadow-lg backdrop-blur-sm">
          <div className="border-b border-slate-200 bg-gradient-to-r from-violet-50 to-purple-50 p-5 rounded-t-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-violet-500 p-2">
                  <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Votantes del Líder</h2>
                  <p className="text-xs text-slate-600">{totalVoters} votantes asignados</p>
                </div>
              </div>
              <Link 
                className="inline-flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white transition-all hover:bg-violet-700" 
                href={`/voters?leader=${leader.id}`}
              >
                Ver en Votantes
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
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
                    <th className="px-4 py-3">Estado</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {leader.voters.map((v) => (
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
                        {v.checkedIn ? (
                          <div className="flex items-center gap-2">
                            <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-semibold text-green-800">
                              <div className="h-1.5 w-1.5 rounded-full bg-green-600"></div>
                              Confirmado
                            </span>
                            <span className="text-xs text-slate-500">{formatDateTimeCO(v.checkedInAt)}</span>
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
                            <div className="h-1.5 w-1.5 rounded-full bg-slate-400"></div>
                            Pendiente
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
                              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
                                v.checkedIn
                                  ? "bg-amber-100 text-amber-700 hover:bg-amber-200"
                                  : "bg-green-500 text-white hover:bg-green-600"
                              }`}
                              type="submit" 
                              title={v.checkedIn ? "Desmarcar" : "Confirmar"}
                            >
                              {v.checkedIn ? "↩" : "✓"}
                            </button>
                          </form>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {leader.voters.length === 0 && (
                    <tr>
                      <td className="px-4 py-12 text-center text-sm text-slate-500" colSpan={6}>
                        <div className="flex flex-col items-center gap-2">
                          <svg className="h-12 w-12 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                          </svg>
                          <p className="font-medium">Este líder aún no tiene votantes</p>
                          <Link 
                            href="/voters/new" 
                            className="mt-2 text-xs text-violet-600 hover:text-violet-700 hover:underline"
                          >
                            Agregar votante →
                          </Link>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="rounded-xl border-2 border-red-200 bg-red-50/50 p-6 backdrop-blur-sm">
          <div className="flex items-start justify-between gap-4">
            <div className="flex gap-3">
              <div className="rounded-lg bg-red-100 p-2">
                <svg className="h-5 w-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div>
                <h3 className="font-bold text-red-900">Zona de Peligro</h3>
                <p className="mt-1 text-sm text-red-700">
                  Eliminar este líder es una acción irreversible. Los votantes asignados quedarán sin líder.
                </p>
              </div>
            </div>
            <DeleteLeaderButton 
              leaderId={leader.id} 
              leaderName={`${leader.nombresLider} ${leader.apellidosLider}`}
            />
          </div>
        </div>
      </div>
    </div>
  );
}