import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/require-auth";
import { VoterForm } from "@/components/VoterForm";
import { createVoterAction } from "@/app/actions/voters";
import { unstable_noStore as noStore } from "next/cache";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export default async function NewVoterPage() {
  noStore();
  const user = await requireAuth();

  const leaders = await prisma.leader.findMany({
    orderBy: [{ apellidosLider: "asc" }, { nombresLider: "asc" }],
    select: { id: true, nombresLider: true, apellidosLider: true }
  });

  return (
    <VoterForm
      title="Nuevo votante"
      initialValues={{ cedulaVotante: "", nombres: "", apellidos: "", dondeVota: "", mesaVotacion: "", leaderId: "none" }}
      leaders={leaders}
      action={createVoterAction}
      cancelHref="/voters"
      canChooseOrigen={user.rol === "ADMIN"}
    />
  );
}