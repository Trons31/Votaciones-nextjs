import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRouteAuth } from "@/lib/route-auth";
import { votersToCsv, votersToXlsx, downloadName } from "@/lib/export";

export const runtime = "nodejs";

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireRouteAuth(request);
  if (auth.response) return auth.response;

  const id = Number(params.id);
  if (!Number.isFinite(id)) return new NextResponse("Bad Request", { status: 400 });

  const { searchParams } = new URL(request.url);
  const format = (searchParams.get("format") || "xlsx").toLowerCase();
  const isCsv = format === "csv";

  const leader = await prisma.leader.findUnique({ where: { id } });
  if (!leader) return new NextResponse("Not found", { status: 404 });

  const voters = await prisma.voter.findMany({
    where: { leaderId: id },
    include: { leader: { select: { id: true, nombresLider: true, apellidosLider: true } } },
    orderBy: [{ apellidos: "asc" }, { nombres: "asc" }]
  });

  const safeName = `${leader.nombresLider}_${leader.apellidosLider}`.replace(/\s+/g, "_").replace(/[^a-zA-Z0-9_\-]/g, "");

  if (isCsv) {
    const buf = Buffer.concat([Buffer.from("\ufeff", "utf-8"), votersToCsv(voters as any)]);
    return new NextResponse(buf, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${downloadName(`votantes_${safeName}`, "csv")}"`
      }
    });
  }

  const buf = await votersToXlsx(voters as any, "Votantes");
  return new NextResponse(buf, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${downloadName(`votantes_${safeName}`, "xlsx")}"`
    }
  });
}
