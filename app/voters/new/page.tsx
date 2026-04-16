import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/require-auth";
import { VoterForm } from "@/components/VoterForm";
import { createVoterAction } from "@/app/actions/voters";
import { unstable_noStore as noStore } from "next/cache";
import { mergeColegios } from "@/lib/colegios";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export default async function NewVoterPage({
  searchParams
}: {
  searchParams: { leader?: string };
}) {
  noStore();
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

  // ✅ si viene /voters/new?leader=22, preselecciona ese líder
  const preselectedLeaderId =
    searchParams.leader && Number.isFinite(Number(searchParams.leader))
      ? String(searchParams.leader)
      : "none";

  return (
    <VoterForm
      title="Nuevo votante"
      initialValues={{
        cedulaVotante: "",
        nombres: "",
        apellidos: "",
        dondeVota: "",
        mesaVotacion: "",
        leaderId: preselectedLeaderId
      }}
      leaders={leaders}
      colegios={colegios}
      action={createVoterAction}
      cancelHref="/voters"
      canChooseOrigen={user.rol === "ADMIN"}
    />
  );
}
