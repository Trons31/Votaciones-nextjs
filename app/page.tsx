import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/require-auth";
import { VoterForm } from "@/components/VoterForm";
import { createVoterAction } from "@/app/actions/voters";
import { mergeColegios } from "@/lib/colegios";

export default async function NewVoterPage() {
  const user = await requireAuth();

  const [leaders, colegiosRows] = await Promise.all([
    prisma.leader.findMany({
      orderBy: [{ apellidosLider: "asc" }, { nombresLider: "asc" }],
      select: { id: true, nombresLider: true, apellidosLider: true }
    }),
    prisma.voter.findMany({
      where: { dondeVota: { not: null }, NOT: { dondeVota: "" } },
      distinct: ["dondeVota"],
      select: { dondeVota: true },
      orderBy: { dondeVota: "asc" }
    })
  ]);

  const colegios = mergeColegios(colegiosRows.map((row) => row.dondeVota));

  return (
    <VoterForm
      title="Nuevo votante"
      initialValues={{ cedulaVotante: "", nombres: "", apellidos: "", dondeVota: "", mesaVotacion: "", leaderId: "none" }}
      leaders={leaders}
      colegios={colegios}
      action={createVoterAction}
      cancelHref="/voters"
      canChooseOrigen={user.rol === "ADMIN"}
    />
  );
}
