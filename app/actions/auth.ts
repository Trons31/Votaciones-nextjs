// lib/auth.ts - Actualización para incluir el rol

import { cookies } from "next/headers";
import { getIronSession } from "iron-session";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

// Tus opciones de sesión existentes
export const sessionOptions = {
  password: process.env.SESSION_SECRET!,
  cookieName: "session",
  cookieOptions: {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
  },
};

// ============================================
// ACTUALIZAR getSessionUser para incluir ROL
// ============================================
export async function getSessionUser() {
  const session = await getIronSession<{ userId: number }>(
    cookies(),
    sessionOptions
  );

  if (!session.userId) return null;

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { 
      id: true, 
      username: true,
      rol: true // ← AGREGAR ESTO
    }
  });

  return user;
}

// ============================================
// setSession y clearSession (sin cambios)
// ============================================
export async function setSession(userId: number) {
  const session = await getIronSession<{ userId: number }>(
    cookies(),
    sessionOptions
  );
  session.userId = userId;
  await session.save();
}

export async function clearSession() {
  const session = await getIronSession<{ userId: number }>(
    cookies(),
    sessionOptions
  );
  session.destroy();
}
export async function logoutAction() {
  await clearSession();
  redirect("/login");
}