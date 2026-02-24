import { PrismaClient, UserRole } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed de usuarios...\n');

  // ============================================
  // CREAR USUARIO ADMIN
  // ============================================
  const adminUsername = process.env.INIT_ADMIN_USERNAME || "admin0912";
  const adminPassword = process.env.INIT_ADMIN_PASSWORD || "pas1290";

  const existingAdmin = await prisma.user.findUnique({ 
    where: { username: adminUsername } 
  });

  if (!existingAdmin) {
    const passwordHash = await bcrypt.hash(adminPassword, 10);
    const admin = await prisma.user.create({
      data: { 
        username: adminUsername, 
        passwordHash,
        rol: UserRole.ADMIN // ← Admin con permisos completos
      }
    });
    console.log(`✅ Usuario ADMIN creado: ${adminUsername}`);
    console.log(`   ID: ${admin.id}`);
    console.log(`   Rol: ${admin.rol}`);
    console.log(`   Contraseña: ${adminPassword}\n`);
  } else {
    console.log(`ℹ️  Usuario admin ya existe: ${adminUsername}`);
    
    // Verificar si tiene el rol correcto
    if (existingAdmin.rol !== UserRole.ADMIN) {
      await prisma.user.update({
        where: { id: existingAdmin.id },
        data: { rol: UserRole.ADMIN }
      });
      console.log(`   ⚠️  Rol actualizado a ADMIN\n`);
    } else {
      console.log(`   Rol: ${existingAdmin.rol}\n`);
    }
  }

  // ============================================
  // CREAR USUARIOS DE PRUEBA (Opcional)
  // ============================================
  const createTestUsers = process.env.CREATE_TEST_USERS === "true";
  
  if (createTestUsers) {
    console.log('📝 Creando usuarios de prueba...\n');

    // Colaborador 1
    const colab1 = await createUserIfNotExists({
      username: 'colaborador',
      password: 'colab123',
      rol: UserRole.COLABORADOR
    });
    if (colab1) {
      console.log(`✅ Colaborador creado: colaborador1 (contraseña: colab123)`);
    }

    console.log('');
  }

  // ============================================
  // RESUMEN FINAL
  // ============================================
  const totalUsers = await prisma.user.count();
  const adminCount = await prisma.user.count({ 
    where: { rol: UserRole.ADMIN } 
  });
  const colaboradorCount = await prisma.user.count({ 
    where: { rol: UserRole.COLABORADOR } 
  });

  console.log('📊 RESUMEN DE USUARIOS:');
  console.log(`   Total: ${totalUsers}`);
  console.log(`   Admins: ${adminCount}`);
  console.log(`   Colaboradores: ${colaboradorCount}\n`);

  // Listar todos los usuarios
  const allUsers = await prisma.user.findMany({
    select: { id: true, username: true, rol: true, createdAt: true }
  });

  console.log('👥 USUARIOS EN EL SISTEMA:');
  allUsers.forEach(user => {
    const badge = user.rol === UserRole.ADMIN ? '👑' : '👤';
    console.log(`   ${badge} ${user.username} (${user.rol}) - ID: ${user.id}`);
  });

  console.log('\n✅ Seed completado exitosamente!\n');
}

// ============================================
// HELPER FUNCTION
// ============================================
async function createUserIfNotExists(data: {
  username: string;
  password: string;
  rol: UserRole;
}) {
  const existing = await prisma.user.findUnique({
    where: { username: data.username }
  });

  if (existing) {
    console.log(`   ⏭️  ${data.username} ya existe`);
    return null;
  }

  const passwordHash = await bcrypt.hash(data.password, 10);
  const user = await prisma.user.create({
    data: {
      username: data.username,
      passwordHash,
      rol: data.rol
    }
  });

  return user;
}

// ============================================
// EJECUCIÓN
// ============================================
main()
  .catch((e) => {
    console.error('❌ Error durante el seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });