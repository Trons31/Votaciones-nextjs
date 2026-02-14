import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const username = process.env.INIT_ADMIN_USERNAME || "admin";
  const password = process.env.INIT_ADMIN_PASSWORD || "admin123";

  const existing = await prisma.user.findUnique({ where: { username } });
  if (!existing) {
    const passwordHash = await bcrypt.hash(password, 10);
    await prisma.user.create({
      data: { username, passwordHash }
    });
    console.log(`✅ Usuario admin creado: ${username}`);
  } else {
    console.log(`ℹ️ Usuario admin ya existe: ${username}`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
