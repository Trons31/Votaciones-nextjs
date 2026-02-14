import { cookies } from "next/headers";
import crypto from "crypto";
import { prisma } from "./prisma";

const COOKIE_NAME = "vc_session";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 días

function secret(): string {
  return process.env.AUTH_SECRET || "dev-secret-change-me";
}

function base64url(input: Buffer): string {
  return input
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function sign(data: string): string {
  const h = crypto.createHmac("sha256", secret());
  h.update(data);
  return base64url(h.digest());
}

export function createSessionValue(userId: number): string {
  const exp = Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS;
  const payload = `${userId}.${exp}`;
  const sig = sign(payload);
  return `${payload}.${sig}`;
}

export function verifySessionValue(value: string): { userId: number; exp: number } | null {
  const parts = value.split(".");
  if (parts.length !== 3) return null;
  const [userIdStr, expStr, sig] = parts;
  const payload = `${userIdStr}.${expStr}`;
  if (sign(payload) !== sig) return null;

  const userId = Number(userIdStr);
  const exp = Number(expStr);
  if (!Number.isFinite(userId) || !Number.isFinite(exp)) return null;
  if (Math.floor(Date.now() / 1000) > exp) return null;

  return { userId, exp };
}

export async function setSession(userId: number) {
  const value = createSessionValue(userId);
  cookies().set(COOKIE_NAME, value, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_TTL_SECONDS
  });
}

export function clearSession() {
  cookies().delete(COOKIE_NAME);
}

export async function getSessionUser() {
  const value = cookies().get(COOKIE_NAME)?.value;
  if (!value) return null;
  const verified = verifySessionValue(value);
  if (!verified) return null;

  const user = await prisma.user.findUnique({
    where: { id: verified.userId },
    select: { id: true, username: true }
  });
  return user;
}
