import { requireAuth } from "@/lib/require-auth";
import { LeaderForm } from "@/components/LeaderForm";
import { createLeaderAction } from "@/app/actions/leaders";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function NewLeaderPage() {
  const user = await requireAuth();

  return (
    <LeaderForm
      title="Nuevo líder"
      initialValues={{
        nombresLider: "",
        apellidosLider: "",
        cedulaLider: "",
        telefono: "",
        zonaBarrio: "",
        notas: ""
      }}
      action={createLeaderAction}
      cancelHref="/leaders"
      canChooseOrigen={user.rol === "ADMIN"}
    />
  );
}