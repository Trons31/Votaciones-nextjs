import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/require-auth";
import { LeaderForm } from "@/components/LeaderForm";
import { updateLeaderAction } from "@/app/actions/leaders";
import { notFound } from "next/navigation";

export default async function EditLeaderPage({ params }: { params: { id: string } }) {
  await requireAuth();

  const id = Number(params.id);
  if (!Number.isFinite(id)) notFound();

  const leader = await prisma.leader.findUnique({ where: { id } });
  if (!leader) notFound();

  return (
    <LeaderForm
      title={`Editar líder`}
      initialValues={{
        nombresLider: leader.nombresLider,
        apellidosLider: leader.apellidosLider,
        cedulaLider: leader.cedulaLider ?? "",
        telefono: leader.telefono ?? "",
        zonaBarrio: leader.zonaBarrio ?? "",
        notas: leader.notas ?? ""
      }}
      action={updateLeaderAction.bind(null, id)}
      cancelHref={`/leaders/${id}`}
    />
  );
}
