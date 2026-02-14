"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { normalizeText } from "@/lib/normalize";
import { requireAuth } from "@/lib/require-auth";

const LeaderSchema = z.object({
  nombresLider: z.string().trim().min(1, "Nombres es obligatorio"),
  apellidosLider: z.string().trim().min(1, "Apellidos es obligatorio"),
  cedulaLider: z.string().trim().optional().or(z.literal("")),
  telefono: z.string().trim().optional().or(z.literal("")),
  zonaBarrio: z.string().trim().optional().or(z.literal("")),
  notas: z.string().trim().optional().or(z.literal(""))
});

function backToRefererOr(path: string) {
  const ref = headers().get("referer");
  if (ref) redirect(ref);
  redirect(path);
}

export async function createLeaderAction(
  prevState: { error?: string } | undefined,
  formData: FormData
) {
  await requireAuth();

  const raw = {
    nombresLider: String(formData.get("nombresLider") ?? ""),
    apellidosLider: String(formData.get("apellidosLider") ?? ""),
    cedulaLider: String(formData.get("cedulaLider") ?? ""),
    telefono: String(formData.get("telefono") ?? ""),
    zonaBarrio: String(formData.get("zonaBarrio") ?? ""),
    notas: String(formData.get("notas") ?? "")
  };

  const parsed = LeaderSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.errors[0]?.message || "Datos inválidos" };

  const ced = parsed.data.cedulaLider?.trim() || null;
  if (ced) {
    const existing = await prisma.leader.findFirst({ where: { cedulaLider: ced }, select: { id: true } });
    if (existing) return { error: "Ya existe un líder con esa cédula." };
  }

  const leader = await prisma.leader.create({
    data: {
      nombresLider: parsed.data.nombresLider.trim(),
      apellidosLider: parsed.data.apellidosLider.trim(),
      cedulaLider: ced,
      telefono: parsed.data.telefono?.trim() || null,
      zonaBarrio: parsed.data.zonaBarrio?.trim() || null,
      notas: parsed.data.notas?.trim() || null,
      origen: "nuevo",
      nombresNorm: normalizeText(parsed.data.nombresLider),
      apellidosNorm: normalizeText(parsed.data.apellidosLider),
      cedulaNorm: ced ? normalizeText(ced) : null,
      telefonoNorm: parsed.data.telefono ? normalizeText(parsed.data.telefono) : null,
      zonaBarrioNorm: parsed.data.zonaBarrio ? normalizeText(parsed.data.zonaBarrio) : null
    },
    select: { id: true }
  });

  redirect(`/leaders?flash=${encodeURIComponent("Líder creado.")}&tone=success`);
}

export async function updateLeaderAction(
  leaderId: number,
  prevState: { error?: string } | undefined,
  formData: FormData
) {
  await requireAuth();

  const raw = {
    nombresLider: String(formData.get("nombresLider") ?? ""),
    apellidosLider: String(formData.get("apellidosLider") ?? ""),
    cedulaLider: String(formData.get("cedulaLider") ?? ""),
    telefono: String(formData.get("telefono") ?? ""),
    zonaBarrio: String(formData.get("zonaBarrio") ?? ""),
    notas: String(formData.get("notas") ?? "")
  };

  const parsed = LeaderSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.errors[0]?.message || "Datos inválidos" };

  const ced = parsed.data.cedulaLider?.trim() || null;
  if (ced) {
    const existing = await prisma.leader.findFirst({
      where: { cedulaLider: ced, NOT: { id: leaderId } },
      select: { id: true }
    });
    if (existing) return { error: "Ya existe otro líder con esa cédula." };
  }

  await prisma.leader.update({
    where: { id: leaderId },
    data: {
      nombresLider: parsed.data.nombresLider.trim(),
      apellidosLider: parsed.data.apellidosLider.trim(),
      cedulaLider: ced,
      telefono: parsed.data.telefono?.trim() || null,
      zonaBarrio: parsed.data.zonaBarrio?.trim() || null,
      notas: parsed.data.notas?.trim() || null,
      nombresNorm: normalizeText(parsed.data.nombresLider),
      apellidosNorm: normalizeText(parsed.data.apellidosLider),
      cedulaNorm: ced ? normalizeText(ced) : null,
      telefonoNorm: parsed.data.telefono ? normalizeText(parsed.data.telefono) : null,
      zonaBarrioNorm: parsed.data.zonaBarrio ? normalizeText(parsed.data.zonaBarrio) : null
    }
  });

  redirect(`/leaders/${leaderId}?flash=${encodeURIComponent("Líder actualizado.")}&tone=success`);
}

export async function deleteLeaderAction(leaderId: number) {
  await requireAuth();

  const cnt = await prisma.voter.count({ where: { leaderId } });
  if (cnt > 0) {
    redirect(
      `/leaders/${leaderId}?flash=${encodeURIComponent(
        "No se puede eliminar: el líder tiene votantes asociados."
      )}&tone=warning`
    );
  }

  await prisma.leader.delete({ where: { id: leaderId } });
  redirect(`/leaders?flash=${encodeURIComponent("Líder eliminado.")}&tone=info`);
}

export async function toggleLeaderCheckInAction(leaderId: number) {
  const user = await requireAuth();
  const leader = await prisma.leader.findUnique({ where: { id: leaderId }, select: { checkedIn: true } });
  if (!leader) redirect("/leaders");

  const now = new Date();

  if (leader.checkedIn) {
    // cerrar último check abierto
    const last = await prisma.leaderCheckIn.findFirst({
      where: { leaderId, checkedOutAt: null },
      orderBy: { checkedInAt: "desc" },
      select: { id: true }
    });
    if (last) {
      await prisma.leaderCheckIn.update({ where: { id: last.id }, data: { checkedOutAt: now } });
    }
    await prisma.leader.update({ where: { id: leaderId }, data: { checkedIn: false, checkedInAt: null } });
    backToRefererOr(`/leaders?flash=${encodeURIComponent("Líder desmarcado.")}&tone=info`);
  } else {
    await prisma.leaderCheckIn.create({
      data: { leaderId, checkedInAt: now, userId: user.id }
    });
    await prisma.leader.update({ where: { id: leaderId }, data: { checkedIn: true, checkedInAt: now } });
    backToRefererOr(`/leaders?flash=${encodeURIComponent("Líder marcado como llegó.")}&tone=success`);
  }
}
