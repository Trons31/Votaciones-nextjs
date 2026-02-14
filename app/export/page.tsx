import Link from "next/link";
import { requireAuth } from "@/lib/require-auth";
import { prisma } from "@/lib/prisma";

export default async function ExportPage() {
  await requireAuth();

  const leaders = await prisma.leader.findMany({
    orderBy: [{ apellidosLider: "asc" }, { nombresLider: "asc" }],
    select: { id: true, nombresLider: true, apellidosLider: true }
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50 to-teal-50 p-4 md:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header Section */}
        <div className="rounded-xl bg-white/80 p-6 shadow-lg backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500 p-3">
              <svg className="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
              </svg>
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-slate-900">
                Centro de Exportación
              </h1>
              <p className="text-sm text-slate-600">
                Descarga datos en múltiples formatos
              </p>
            </div>
          </div>
          
          {/* Info Banner */}
          <div className="mt-4 flex items-start gap-3 rounded-lg bg-blue-50 p-4">
            <svg className="h-5 w-5 flex-shrink-0 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="text-sm text-blue-900">
              <p className="font-medium">Información importante</p>
              <p className="mt-1 text-blue-700">
                Todas las fechas y horas se formatean en zona horaria de Colombia (America/Bogota)
              </p>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 p-6 text-white shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-100">Excel</p>
                <p className="mt-1 text-2xl font-bold">.xlsx</p>
              </div>
              <div className="rounded-full bg-white/20 p-3">
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            </div>
            <div className="mt-3 text-xs text-green-100">Formato completo con estilos</div>
          </div>

          <div className="rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 p-6 text-white shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-cyan-100">CSV</p>
                <p className="mt-1 text-2xl font-bold">.csv</p>
              </div>
              <div className="rounded-full bg-white/20 p-3">
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            </div>
            <div className="mt-3 text-xs text-cyan-100">Datos separados por comas</div>
          </div>

          <div className="rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 p-6 text-white shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-100">Líderes</p>
                <p className="mt-1 text-2xl font-bold">{leaders.length}</p>
              </div>
              <div className="rounded-full bg-white/20 p-3">
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
            </div>
            <div className="mt-3 text-xs text-purple-100">Exportables individualmente</div>
          </div>
        </div>

        {/* Export Sections */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Votantes Global */}
          <div className="rounded-xl bg-white/80 shadow-lg backdrop-blur-sm">
            <div className="border-b border-slate-200 bg-gradient-to-r from-green-50 to-emerald-50 p-5 rounded-t-xl">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-green-500 p-2">
                  <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Votantes (Global)</h2>
                  <p className="text-xs text-slate-600">Exporta todos los votantes o filtrados</p>
                </div>
              </div>
            </div>

            <div className="p-5 space-y-4">
              {/* Todos */}
              <div className="group rounded-lg border-2 border-slate-200 bg-slate-50 p-4 transition-all hover:border-green-400 hover:bg-green-50">
                <div className="mb-3 flex items-center gap-2">
                  <div className="rounded-md bg-green-100 p-1.5">
                    <svg className="h-4 w-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <span className="text-sm font-semibold text-slate-900">Todos los votantes</span>
                </div>
                <div className="flex gap-2">
                  <Link 
                    className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-green-600 px-4 py-2.5 text-sm font-semibold text-white transition-all hover:bg-green-700 hover:shadow-md" 
                    href="/export/all.xlsx"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Excel
                  </Link>
                  <Link 
                    className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-cyan-600 px-4 py-2.5 text-sm font-semibold text-white transition-all hover:bg-cyan-700 hover:shadow-md" 
                    href="/export/all.csv"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    CSV
                  </Link>
                </div>
              </div>

              {/* Confirmados */}
              <div className="group rounded-lg border-2 border-slate-200 bg-slate-50 p-4 transition-all hover:border-blue-400 hover:bg-blue-50">
                <div className="mb-3 flex items-center gap-2">
                  <div className="rounded-md bg-blue-100 p-1.5">
                    <svg className="h-4 w-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <span className="text-sm font-semibold text-slate-900">Votantes confirmados</span>
                </div>
                <div className="flex gap-2">
                  <Link 
                    className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-green-600 px-4 py-2.5 text-sm font-semibold text-white transition-all hover:bg-green-700 hover:shadow-md" 
                    href="/export/confirmed.xlsx"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Excel
                  </Link>
                  <Link 
                    className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-cyan-600 px-4 py-2.5 text-sm font-semibold text-white transition-all hover:bg-cyan-700 hover:shadow-md" 
                    href="/export/confirmed.csv"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    CSV
                  </Link>
                </div>
              </div>

              {/* Pendientes */}
              <div className="group rounded-lg border-2 border-slate-200 bg-slate-50 p-4 transition-all hover:border-amber-400 hover:bg-amber-50">
                <div className="mb-3 flex items-center gap-2">
                  <div className="rounded-md bg-amber-100 p-1.5">
                    <svg className="h-4 w-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <span className="text-sm font-semibold text-slate-900">Votantes pendientes</span>
                </div>
                <div className="flex gap-2">
                  <Link 
                    className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-green-600 px-4 py-2.5 text-sm font-semibold text-white transition-all hover:bg-green-700 hover:shadow-md" 
                    href="/export/pending.xlsx"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Excel
                  </Link>
                  <Link 
                    className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-cyan-600 px-4 py-2.5 text-sm font-semibold text-white transition-all hover:bg-cyan-700 hover:shadow-md" 
                    href="/export/pending.csv"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    CSV
                  </Link>
                </div>
              </div>
            </div>
          </div>

          

          {/* Reportes y Filtrados */}
          <div className="rounded-xl bg-white/80 shadow-lg backdrop-blur-sm">
            <div className="border-b border-slate-200 bg-gradient-to-r from-purple-50 to-indigo-50 p-5 rounded-t-xl">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-purple-500 p-2">
                  <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Reportes y Filtros</h2>
                  <p className="text-xs text-slate-600">Exporta reportes completos o datos filtrados</p>
                </div>
              </div>
            </div>

            <div className="p-5 space-y-4">
              {/* Reporte General */}
              <div className="group rounded-lg border-2 border-slate-200 bg-slate-50 p-4 transition-all hover:border-orange-400 hover:bg-orange-50">
                <div className="mb-3 flex items-center gap-2">
                  <div className="rounded-md bg-orange-100 p-1.5">
                    <svg className="h-4 w-4 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <span className="text-sm font-semibold text-slate-900">Reporte general completo</span>
                </div>
                <div className="flex gap-2">
                  <Link 
                    className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-green-600 px-4 py-2.5 text-sm font-semibold text-white transition-all hover:bg-green-700 hover:shadow-md" 
                    href="/reporte/export.xlsx"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Excel
                  </Link>
                  <Link 
                    className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-cyan-600 px-4 py-2.5 text-sm font-semibold text-white transition-all hover:bg-cyan-700 hover:shadow-md" 
                    href="/reporte/export.csv"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    CSV
                  </Link>
                </div>
              </div>


              {/* Info adicional */}
              <div className="rounded-lg bg-slate-100 p-4">
                <div className="flex items-start gap-3">
                  <svg className="h-5 w-5 flex-shrink-0 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="text-xs text-slate-600">
                    <p className="font-medium text-slate-700">Tip</p>
                    <p className="mt-1">
                      Los archivos Excel incluyen formato y estilos. Los CSV son compatibles con cualquier software de hojas de cálculo.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Por Líder Section */}
        <div className="rounded-xl bg-white/80 shadow-lg backdrop-blur-sm">
          <div className="border-b border-slate-200 bg-gradient-to-r from-violet-50 to-purple-50 p-5 rounded-t-xl">
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-violet-500 p-2">
                    <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">Votantes por Líder</h2>
                    <p className="text-xs text-slate-600">Descarga los votantes asignados a cada líder</p>
                  </div>
                </div>
                {leaders.length > 12 && (
                  <span className="rounded-full bg-violet-100 px-3 py-1 text-xs font-semibold text-violet-700">
                    Mostrando 12 de {leaders.length}
                  </span>
                )}
              </div>
              {/* Badge informativo */}
              <div className="flex items-center gap-2 rounded-lg bg-violet-100 px-3 py-2">
                <svg className="h-4 w-4 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-xs font-medium text-violet-900">
                  Al exportar por líder, se descargan únicamente los <span className="font-bold">votantes asignados</span> a ese líder
                </p>
              </div>
            </div>
          </div>

          <div className="p-5">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {leaders.slice(0, 12).map((l) => (
                <div key={l.id} className="group rounded-lg border-2 border-slate-200 bg-slate-50 p-4 transition-all hover:border-violet-400 hover:bg-violet-50">
                  <Link 
                    className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-900 hover:text-violet-600" 
                    href={`/leaders/${l.id}`}
                  >
                    <svg className="h-4 w-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <span className="truncate">{l.nombresLider} {l.apellidosLider}</span>
                  </Link>
                  <p className="mb-3 text-xs text-slate-500">Exportar sus votantes</p>
                  <div className="flex gap-2">
                    <Link 
                      className="flex-1 inline-flex items-center justify-center gap-1 rounded-md bg-green-600 px-3 py-2 text-xs font-semibold text-white transition-all hover:bg-green-700" 
                      href={`/export/leader/${l.id}?format=xlsx`}
                    >
                      <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3" />
                      </svg>
                      Excel
                    </Link>
                    <Link 
                      className="flex-1 inline-flex items-center justify-center gap-1 rounded-md bg-cyan-600 px-3 py-2 text-xs font-semibold text-white transition-all hover:bg-cyan-700" 
                      href={`/export/leader/${l.id}?format=csv`}
                    >
                      <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3" />
                      </svg>
                      CSV
                    </Link>
                  </div>
                </div>
              ))}
            </div>

            {leaders.length > 12 && (
              <div className="mt-4 rounded-lg bg-violet-50 p-4">
                <div className="flex items-start gap-3">
                  <svg className="h-5 w-5 flex-shrink-0 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="text-sm">
                    <p className="font-medium text-violet-900">Más líderes disponibles</p>
                    <p className="mt-1 text-xs text-violet-700">
                      Para exportar datos de otros líderes, accede al perfil del líder desde la sección de{" "}
                      <Link href="/leaders" className="font-semibold underline">
                        Líderes
                      </Link>
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