"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { normalizeText } from "@/lib/normalize";
import { requireAuth } from "@/lib/require-auth";

const VoterSchema = z.object({
  cedulaVotante: z.string().trim().min(5, "Cédula es obligatoria"),
  nombres: z.string().trim().min(1, "Nombres es obligatorio"),
  apellidos: z.string().trim().min(1, "Apellidos es obligatorio"),
  dondeVota: z.string().trim().optional().or(z.literal("")),
  mesaVotacion: z.string().trim().optional().or(z.literal("")),
  leaderId: z.string().optional().or(z.literal(""))
});

function backToRefererOr(path: string) {
  const ref = headers().get("referer");
  if (ref) redirect(ref);
  redirect(path);
}

export async function createVoterAction(prevState: { error?: string } | undefined, formData: FormData) {
  await requireAuth();

  const raw = {
    cedulaVotante: String(formData.get("cedulaVotante") ?? ""),
    nombres: String(formData.get("nombres") ?? ""),
    apellidos: String(formData.get("apellidos") ?? ""),
    dondeVota: String(formData.get("dondeVota") ?? ""),
    mesaVotacion: String(formData.get("mesaVotacion") ?? ""),
    leaderId: String(formData.get("leaderId") ?? "")
  };

  const parsed = VoterSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.errors[0]?.message || "Datos inválidos" };

  const ced = parsed.data.cedulaVotante.trim();
  const existing = await prisma.voter.findFirst({ where: { cedulaVotante: ced }, select: { id: true } });
  if (existing) return { error: "Ya existe un votante con esa cédula." };

  const leaderId = parsed.data.leaderId && parsed.data.leaderId !== "none" && parsed.data.leaderId !== ""
    ? Number(parsed.data.leaderId)
    : null;

  if (leaderId && !Number.isFinite(leaderId)) return { error: "Líder inválido." };

  await prisma.voter.create({
    data: {
      cedulaVotante: ced,
      nombres: parsed.data.nombres.trim(),
      apellidos: parsed.data.apellidos.trim(),
      dondeVota: parsed.data.dondeVota?.trim() || null,
      mesaVotacion: parsed.data.mesaVotacion?.trim() || null,
      leaderId,
      estado: "Votó",
      origen: "nuevo",
      cedulaNorm: normalizeText(ced),
      nombresNorm: normalizeText(parsed.data.nombres),
      apellidosNorm: normalizeText(parsed.data.apellidos),
      dondeVotaNorm: parsed.data.dondeVota ? normalizeText(parsed.data.dondeVota) : null,
      mesaVotacionNorm: parsed.data.mesaVotacion ? normalizeText(parsed.data.mesaVotacion) : null
    }
  });

  redirect(`/voters?flash=${encodeURIComponent("Votante creado.")}&tone=success`);
}

export async function updateVoterAction(voterId: number, prevState: { error?: string } | undefined, formData: FormData) {
  await requireAuth();

  const raw = {
    cedulaVotante: String(formData.get("cedulaVotante") ?? ""),
    nombres: String(formData.get("nombres") ?? ""),
    apellidos: String(formData.get("apellidos") ?? ""),
    dondeVota: String(formData.get("dondeVota") ?? ""),
    mesaVotacion: String(formData.get("mesaVotacion") ?? ""),
    leaderId: String(formData.get("leaderId") ?? "")
  };

  const parsed = VoterSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.errors[0]?.message || "Datos inválidos" };

  const ced = parsed.data.cedulaVotante.trim();
  const existing = await prisma.voter.findFirst({
    where: { cedulaVotante: ced, NOT: { id: voterId } },
    select: { id: true }
  });
  if (existing) return { error: "Ya existe otro votante con esa cédula." };

  const leaderId = parsed.data.leaderId && parsed.data.leaderId !== "none" && parsed.data.leaderId !== ""
    ? Number(parsed.data.leaderId)
    : null;

  if (leaderId && !Number.isFinite(leaderId)) return { error: "Líder inválido." };

  await prisma.voter.update({
    where: { id: voterId },
    data: {
      cedulaVotante: ced,
      nombres: parsed.data.nombres.trim(),
      apellidos: parsed.data.apellidos.trim(),
      dondeVota: parsed.data.dondeVota?.trim() || null,
      mesaVotacion: parsed.data.mesaVotacion?.trim() || null,
      leaderId,
      cedulaNorm: normalizeText(ced),
      nombresNorm: normalizeText(parsed.data.nombres),
      apellidosNorm: normalizeText(parsed.data.apellidos),
      dondeVotaNorm: parsed.data.dondeVota ? normalizeText(parsed.data.dondeVota) : null,
      mesaVotacionNorm: parsed.data.mesaVotacion ? normalizeText(parsed.data.mesaVotacion) : null
    }
  });

  redirect(`/voters?flash=${encodeURIComponent("Votante actualizado.")}&tone=success`);
}

export async function deleteVoterAction(voterId: number) {
  await requireAuth();
  await prisma.voter.delete({ where: { id: voterId } });
  
  // Redirigir directamente a /voters en lugar de usar backToRefererOr
  // porque el referer (/voters/{id}/edit) ya no existe después de eliminar
  redirect(`/voters?flash=${encodeURIComponent("Votante eliminado.")}&tone=success`);
}

export async function toggleVoterCheckInAction(voterId: number) {
  const user = await requireAuth();

  const voter = await prisma.voter.findUnique({ where: { id: voterId }, select: { checkedIn: true } });
  if (!voter) redirect("/voters");

  const now = new Date();

  if (voter.checkedIn) {
    const last = await prisma.voterCheckIn.findFirst({
      where: { voterId, checkedOutAt: null },
      orderBy: { checkedInAt: "desc" },
      select: { id: true }
    });
    if (last) {
      await prisma.voterCheckIn.update({ where: { id: last.id }, data: { checkedOutAt: now } });
    }
    await prisma.voter.update({ where: { id: voterId }, data: { checkedIn: false, checkedInAt: null } });
    backToRefererOr(`/voters?flash=${encodeURIComponent("Votante desmarcado.")}&tone=info`);
  } else {
    await prisma.voterCheckIn.create({ data: { voterId, checkedInAt: now, userId: user.id } });
    await prisma.voter.update({ where: { id: voterId }, data: { checkedIn: true, checkedInAt: now } });
    backToRefererOr(`/voters?flash=${encodeURIComponent("Votante confirmado.")}&tone=success`);
  }
}