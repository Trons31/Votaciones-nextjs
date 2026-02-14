import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRouteAuth } from "@/lib/route-auth";
import { votersToXlsx, downloadName } from "@/lib/export";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const auth = await requireRouteAuth(request);
  if (auth.response) return auth.response;

  const voters = await prisma.voter.findMany({
    where: { checkedIn: true },
    include: { leader: { select: { id: true, nombresLider: true, apellidosLider: true } } },
    orderBy: [{ checkedInAt: "desc" }]
  });

  const buf = await votersToXlsx(voters as any, "Confirmados");
  
  // Convierte el Buffer a Uint8Array para compatibilidad con NextResponse
  const uint8Array = new Uint8Array(buf);
  
  return new NextResponse(uint8Array, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${downloadName("votantes_confirmados", "xlsx")}"`
    }
  });
}