import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRouteAuth } from "@/lib/route-auth";
import { reportToCsv, downloadName } from "@/lib/export";
import { formatIsoCO } from "@/lib/time";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const auth = await requireRouteAuth(request);
  if (auth.response) return auth.response;

  const generatedAt = new Date();

  const [
    totalVoters,
    totalLeaders,
    totalIndependientes,
    precargados,
    nuevos,
    votersConfirmados,
    leadersConfirmados,
    porColegioGrouped,
    porMesaGrouped,
    leaders,
    groupedByLeader
  ] = await Promise.all([
    prisma.voter.count(),
    prisma.leader.count(),
    prisma.voter.count({ where: { leaderId: null } }),
    prisma.voter.count({ where: { origen: "precargado" } }),
    prisma.voter.count({ where: { origen: "nuevo" } }),
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
      orderBy: [{ dondeVota: "asc" }, { mesaVotacion: "asc" }]
    }),
    prisma.leader.findMany({ orderBy: [{ apellidosLider: "asc" }, { nombresLider: "asc" }], select: { id: true, nombresLider: true, apellidosLider: true } }),
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

const porLider: Array<[string, number]> = [
  ["Independientes (sin líder)", totalIndependientes],
  ...leaders.map((l) => [`${l.nombresLider} ${l.apellidosLider}`, countMap.get(l.id) ?? 0] as [string, number])
];

  const porColegio: Array<[string, number]> = porColegioGrouped.map((r) => [r.dondeVota || "(Sin colegio)", r._count._all]);

  const porMesa: Array<[string, string, number]> = porMesaGrouped.map((r) => [r.dondeVota!, r.mesaVotacion!, r._count._all]);

  const resumen = {
    generado: formatIsoCO(generatedAt),
    total_votantes: totalVoters,
    total_lideres: totalLeaders,
    independientes: totalIndependientes,
    precargados,
    nuevos,
    votantes_confirmados: votersConfirmados,
    lideres_confirmados: leadersConfirmados
  };

  const buf = Buffer.concat([Buffer.from("\ufeff", "utf-8"), reportToCsv({ resumen, porLider, porColegio, porMesa })]);

  return new NextResponse(buf, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${downloadName("reporte", "csv")}"`
    }
  });
}
