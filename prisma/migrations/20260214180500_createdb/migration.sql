-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "username" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Leader" (
    "id" SERIAL NOT NULL,
    "nombresLider" TEXT NOT NULL,
    "apellidosLider" TEXT NOT NULL,
    "cedulaLider" TEXT,
    "telefono" TEXT,
    "zonaBarrio" TEXT,
    "notas" TEXT,
    "fechaRegistro" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "checkedIn" BOOLEAN NOT NULL DEFAULT false,
    "checkedInAt" TIMESTAMPTZ(3),
    "origen" TEXT,
    "nombresNorm" TEXT NOT NULL,
    "apellidosNorm" TEXT NOT NULL,
    "cedulaNorm" TEXT,
    "telefonoNorm" TEXT,
    "zonaBarrioNorm" TEXT,

    CONSTRAINT "Leader_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Voter" (
    "id" SERIAL NOT NULL,
    "cedulaVotante" TEXT NOT NULL,
    "nombres" TEXT NOT NULL,
    "apellidos" TEXT NOT NULL,
    "dondeVota" TEXT,
    "mesaVotacion" TEXT,
    "leaderId" INTEGER,
    "estado" TEXT NOT NULL DEFAULT 'Votó',
    "fechaRegistro" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "checkedIn" BOOLEAN NOT NULL DEFAULT false,
    "checkedInAt" TIMESTAMPTZ(3),
    "origen" TEXT,
    "cedulaNorm" TEXT NOT NULL,
    "nombresNorm" TEXT NOT NULL,
    "apellidosNorm" TEXT NOT NULL,
    "dondeVotaNorm" TEXT,
    "mesaVotacionNorm" TEXT,

    CONSTRAINT "Voter_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeaderCheckIn" (
    "id" SERIAL NOT NULL,
    "leaderId" INTEGER NOT NULL,
    "checkedInAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "checkedOutAt" TIMESTAMPTZ(3),
    "userId" INTEGER,

    CONSTRAINT "LeaderCheckIn_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VoterCheckIn" (
    "id" SERIAL NOT NULL,
    "voterId" INTEGER NOT NULL,
    "checkedInAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "checkedOutAt" TIMESTAMPTZ(3),
    "userId" INTEGER,

    CONSTRAINT "VoterCheckIn_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "Leader_cedulaLider_key" ON "Leader"("cedulaLider");

-- CreateIndex
CREATE INDEX "Leader_checkedIn_idx" ON "Leader"("checkedIn");

-- CreateIndex
CREATE UNIQUE INDEX "Voter_cedulaVotante_key" ON "Voter"("cedulaVotante");

-- CreateIndex
CREATE INDEX "Voter_leaderId_idx" ON "Voter"("leaderId");

-- CreateIndex
CREATE INDEX "Voter_dondeVota_idx" ON "Voter"("dondeVota");

-- CreateIndex
CREATE INDEX "Voter_mesaVotacion_idx" ON "Voter"("mesaVotacion");

-- CreateIndex
CREATE INDEX "Voter_checkedIn_idx" ON "Voter"("checkedIn");

-- CreateIndex
CREATE INDEX "LeaderCheckIn_leaderId_checkedInAt_idx" ON "LeaderCheckIn"("leaderId", "checkedInAt");

-- CreateIndex
CREATE INDEX "VoterCheckIn_voterId_checkedInAt_idx" ON "VoterCheckIn"("voterId", "checkedInAt");

-- AddForeignKey
ALTER TABLE "Voter" ADD CONSTRAINT "Voter_leaderId_fkey" FOREIGN KEY ("leaderId") REFERENCES "Leader"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeaderCheckIn" ADD CONSTRAINT "LeaderCheckIn_leaderId_fkey" FOREIGN KEY ("leaderId") REFERENCES "Leader"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeaderCheckIn" ADD CONSTRAINT "LeaderCheckIn_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VoterCheckIn" ADD CONSTRAINT "VoterCheckIn_voterId_fkey" FOREIGN KEY ("voterId") REFERENCES "Voter"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VoterCheckIn" ADD CONSTRAINT "VoterCheckIn_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
