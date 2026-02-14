import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRouteAuth } from "@/lib/route-auth";
import { parseLeaderFilterValue } from "@/lib/filters";
import { votersToXlsx, downloadName } from "@/lib/export";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const auth = await requireRouteAuth(request);
  if (auth.response) return auth.response;

  const { searchParams } = new URL(request.url);
  const leader = parseLeaderFilterValue(searchParams.get("leader"));
  const colegio = (searchParams.get("colegio") || "").trim();
  const mesa = (searchParams.get("mesa") || "").trim();

  const leaderWhere =
    leader.kind === "none" ? { leaderId: null as any } : leader.kind === "id" ? { leaderId: leader.id } : {};

  const where: any = {
    ...leaderWhere,
    ...(colegio ? { dondeVota: colegio } : {}),
    ...(mesa ? { mesaVotacion: mesa } : {})
  };

  const voters = await prisma.voter.findMany({
    where,
    include: { leader: { select: { id: true, nombresLider: true, apellidosLider: true } } },
    orderBy: [{ apellidos: "asc" }, { nombres: "asc" }]
  });

  const buf = await votersToXlsx(voters as any, "Filtrados");
  return new NextResponse(buf, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${downloadName("votantes_filtrados", "xlsx")}"`
    }
  });
}
