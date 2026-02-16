"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { clearSession, setSession } from "@/lib/auth";
import { ensureInitAdmin } from "@/lib/init-admin";

export async function loginAction(prevState: { error?: string } | undefined, formData: FormData) {
  await ensureInitAdmin();

  const username = String(formData.get("username") || "").trim();
  const password = String(formData.get("password") || "");

  if (!username || !password) {
    return { error: "Usuario y clave son obligatorios." };
  }

  const user = await prisma.user.findUnique({ where: { username } });
  if (!user) return { error: "Usuario o clave inválidos." };

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return { error: "Usuario o clave inválidos." };

  await setSession(user.id);
  redirect("/voters");
}

export async function logoutAction() {
  clearSession();
  redirect("/login");
}
