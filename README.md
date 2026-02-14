# Control de Votantes (Next.js + Tailwind + PostgreSQL)

Migración del proyecto original (Flask/SQLite) a **Next.js (App Router)** usando:

- **Tailwind CSS** para UI
- **PostgreSQL** + **Prisma** como ORM
- **Server Actions** para CRUD y confirmaciones (sin API REST)
- **2 tablas adicionales** para registrar la llegada (check-in) de **líderes** y **votantes**
- Horas mostradas siempre en **Colombia (America/Bogota)**, incluso en Vercel

## Requisitos

- Node.js 18+
- Una base de datos PostgreSQL (local o remota)
- (Opcional) Vercel para despliegue

## Variables de entorno

Crea un archivo `.env` (puedes copiar `.env.example`):

```bash
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/DBNAME?schema=public"

# Usuario admin inicial (se crea automáticamente la primera vez)
ADMIN_USERNAME="admin"
ADMIN_PASSWORD="admin12345"

# Seguridad de sesión (>= 32 chars)
SESSION_SECRET="pon-aqui-un-secret-largo-y-random"
```

> En Vercel configura estas variables en **Project Settings → Environment Variables**.

## Instalación

```bash
npm install
```

## Migraciones Prisma

En desarrollo:

```bash
npx prisma migrate dev
npx prisma generate
```

En producción (Vercel):

```bash
npx prisma migrate deploy
```

## Ejecutar

```bash
npm run dev
```

Abrir: http://localhost:3000

## Estructura relevante

- `app/` (App Router)
  - `leaders/` páginas de líderes
  - `voters/` páginas de votantes
  - `filtros/` página de filtros/resumen
  - `reporte/` reporte global + export
  - `export/` menú y endpoints de exportación (CSV/XLSX)
- `components/` componentes reutilizables (cumpliendo la estructura solicitada)
- `app/actions/` server actions (auth, leaders, voters)
- `prisma/schema.prisma` modelos PostgreSQL + tablas extra de check-in
- `lib/time.ts` helpers de fecha/hora **siempre en Colombia**
- `lib/export.ts` exportaciones CSV/XLSX (ExcelJS)

## Funcionalidades migradas (paridad con el proyecto original)

- ✅ Login (usuario/clave)
- ✅ CRUD de Líderes (crear, editar, eliminar)
- ✅ CRUD de Votantes (crear, editar, eliminar)
- ✅ Confirmar llegada de líderes (✓ / ↩)
- ✅ Confirmar llegada de votantes (✓ / ↩)
- ✅ Filtros por líder / colegio / mesa + resumen (top colegios/mesas/líder)
- ✅ Reporte global (totales y distribuciones)
- ✅ Exportación:
  - `/export/all.(csv|xlsx)` (todos)
  - `/export/confirmed.(csv|xlsx)` (confirmados)
  - `/export/pending.(csv|xlsx)` (pendientes)
  - `/export/leader/:id?format=csv|xlsx` (por líder)
  - `/export/filtered.(csv|xlsx)?leader=...&colegio=...&mesa=...` (filtrado)
  - `/reporte/export.(csv|xlsx)` (reporte global)

## Tablas extra para check-in

Se añadieron 2 tablas nuevas:

- `LeaderCheckIn` — historial de llegada/salida de líderes
- `VoterCheckIn` — historial de llegada/salida de votantes

Al marcar ✓ se crea un registro con `checkedInAt`.
Al desmarcar ↩ se completa `checkedOutAt` en el último check abierto.

## Hora en Colombia (Vercel)

- En UI se usa `Intl.DateTimeFormat` con `timeZone: "America/Bogota"`.
- En exportaciones también se formatea en Colombia.
- En la base de datos se guardan timestamps como `TIMESTAMPTZ`, para evitar problemas de zona horaria.
