import bcrypt from "bcryptjs";
import { prisma } from "./prisma";

export async function ensureInitAdmin() {
  const username = process.env.INIT_ADMIN_USERNAME || "admin";
  const password = process.env.INIT_ADMIN_PASSWORD || "admin123";

  const anyUser = await prisma.user.findFirst({ select: { id: true } });
  if (!anyUser) {
    const passwordHash = await bcrypt.hash(password, 10);
    await prisma.user.create({
      data: {
        username,
        passwordHash
      }
    });
  }
}
