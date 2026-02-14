import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRouteAuth } from "@/lib/route-auth";
import { votersToXlsx, downloadName } from "@/lib/export";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const auth = await requireRouteAuth(request);
  if (auth.response) return auth.response;

  const voters = await prisma.voter.findMany({
    where: { checkedIn: false },
    include: { leader: { select: { id: true, nombresLider: true, apellidosLider: true } } },
    orderBy: [{ apellidos: "asc" }, { nombres: "asc" }]
  });

  const buf = await votersToXlsx(voters as any, "Pendientes");
  return new NextResponse(buf, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${downloadName("votantes_pendientes", "xlsx")}"`
    }
  });
}
