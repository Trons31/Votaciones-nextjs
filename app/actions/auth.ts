"use server";

import { cookies } from "next/headers";
import { getIronSession } from "iron-session";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { UserRole } from "@prisma/client";

// ============================================
// TIPO DE DATOS DE LA SESIÓN
// ============================================
interface SessionData {
  userId: number;
  username: string;
  rol: UserRole;
}

// ============================================
// OPCIONES DE SESIÓN
// ============================================
export const sessionOptions = {
  password: process.env.SESSION_SECRET!,
  cookieName: "session",
  cookieOptions: {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
  },
};

// ============================================
// GET SESSION USER - Devuelve datos de la sesión
// ============================================
export async function getSessionUser() {
  const session = await getIronSession<SessionData>(
    cookies(),
    sessionOptions
  );

  if (!session.userId) return null;

  // Devolver los datos almacenados en la sesión
  return {
    id: session.userId,
    username: session.username,
    rol: session.rol
  };
}

// ============================================
// SET SESSION - Guarda id, username y rol
// ============================================
export async function setSession(userId: number, username: string, rol: UserRole) {
  const session = await getIronSession<SessionData>(
    cookies(),
    sessionOptions
  );
  
  session.userId = userId;
  session.username = username;
  session.rol = rol;
  
  await session.save();
}

// ============================================
// CLEAR SESSION - Limpia la sesión
// ============================================
export async function clearSession() {
  const session = await getIronSession<SessionData>(
    cookies(),
    sessionOptions
  );
  session.destroy();
}

// ============================================
// LOGOUT ACTION - Cierra sesión y redirige
// ============================================
export async function logoutAction() {
  await clearSession();
  redirect("/login");
}