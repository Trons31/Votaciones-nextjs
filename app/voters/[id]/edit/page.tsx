import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/require-auth";
import { VoterForm } from "@/components/VoterForm";
import { updateVoterAction, deleteVoterAction } from "@/app/actions/voters";
import { notFound } from "next/navigation";
import { FlashMessage } from "@/components/FlashMessage";
import { formatDateTimeCO } from "@/lib/time";

export default async function EditVoterPage({
  params,
  searchParams
}: {
  params: { id: string };
  searchParams: { flash?: string; tone?: string };
}) {
  await requireAuth();

  const id = Number(params.id);
  if (!Number.isFinite(id)) notFound();

  const voter = await prisma.voter.findUnique({
    where: { id },
    include: { leader: { select: { id: true, nombresLider: true, apellidosLider: true } } }
  });
  if (!voter) notFound();

  const leaders = await prisma.leader.findMany({
    orderBy: [{ apellidosLider: "asc" }, { nombresLider: "asc" }],
    select: { id: true, nombresLider: true, apellidosLider: true }
  });

  const flash = searchParams.flash ? decodeURIComponent(searchParams.flash) : "";
  const tone =
    searchParams.tone === "success" || searchParams.tone === "warning" || searchParams.tone === "danger"
      ? (searchParams.tone as any)
      : "info";

  return (
    <div className="space-y-6">
      {flash ? <FlashMessage message={flash} tone={tone} /> : null}

      <VoterForm
        title="Editar votante"
        initialValues={{
          cedulaVotante: voter.cedulaVotante,
          nombres: voter.nombres,
          apellidos: voter.apellidos,
          dondeVota: voter.dondeVota ?? "",
          mesaVotacion: voter.mesaVotacion ?? "",
          leaderId: voter.leaderId ? String(voter.leaderId) : "none"
        }}
        leaders={leaders}
        action={updateVoterAction.bind(null, id)}
        cancelHref="/voters"
      />

      <div className="rounded-lg border bg-white p-4 shadow-sm">
        <h2 className="text-lg font-semibold">Acciones</h2>
        <div className="mt-2 text-sm text-slate-600">
          Estado: <span className="font-medium">{voter.estado}</span> • Origen:{" "}
          <span className="font-medium">{voter.origen ?? "—"}</span> • Registrado:{" "}
          <span className="font-medium">{formatDateTimeCO(voter.fechaRegistro)}</span>
        </div>

        <form action={deleteVoterAction.bind(null, id)} className="mt-4">
          <button
            type="submit"
            className="rounded-md border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-100"
          >
            Eliminar votante
          </button>
          <p className="mt-2 text-xs text-slate-500">Esta acción no se puede deshacer.</p>
        </form>
      </div>
    </div>
  );
}
