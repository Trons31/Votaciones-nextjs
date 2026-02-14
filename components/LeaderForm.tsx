"use client";

import { useFormState, useFormStatus } from "react-dom";
import Link from "next/link";

type LeaderValues = {
  nombresLider: string;
  apellidosLider: string;
  cedulaLider: string;
  telefono: string;
  zonaBarrio: string;
  notas: string;
};

type FormState = {
  error?: string;
} | undefined;

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60"
    >
      {pending ? "Guardando..." : label}
    </button>
  );
}

export function LeaderForm({
  title,
  initialValues,
  action,
  cancelHref
}: {
  title: string;
  initialValues: LeaderValues;
  action: (prevState: FormState, formData: FormData) => Promise<FormState>;
  cancelHref: string;
}) {
  const [state, formAction] = useFormState<FormState, FormData>(action, undefined);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">{title}</h1>

      <form action={formAction} className="rounded-lg border bg-white p-4 shadow-sm">
        {state?.error ? <div className="mb-3 rounded-md bg-red-50 p-2 text-sm text-red-700">{state.error}</div> : null}

        <div className="grid gap-3 md:grid-cols-2">
          <div className="space-y-1">
            <label className="text-sm font-medium">Nombres</label>
            <input
              name="nombresLider"
              defaultValue={initialValues.nombresLider}
              className="w-full rounded-md border px-3 py-2 text-sm"
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium">Apellidos</label>
            <input
              name="apellidosLider"
              defaultValue={initialValues.apellidosLider}
              className="w-full rounded-md border px-3 py-2 text-sm"
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium">Cédula</label>
            <input
              name="cedulaLider"
              defaultValue={initialValues.cedulaLider}
              className="w-full rounded-md border px-3 py-2 text-sm"
              placeholder="Opcional"
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium">Teléfono</label>
            <input
              name="telefono"
              defaultValue={initialValues.telefono}
              className="w-full rounded-md border px-3 py-2 text-sm"
              placeholder="Opcional"
            />
          </div>

          <div className="space-y-1 md:col-span-2">
            <label className="text-sm font-medium">Zona / Barrio</label>
            <input
              name="zonaBarrio"
              defaultValue={initialValues.zonaBarrio}
              className="w-full rounded-md border px-3 py-2 text-sm"
              placeholder="Opcional"
            />
          </div>

          <div className="space-y-1 md:col-span-2">
            <label className="text-sm font-medium">Notas</label>
            <textarea
              name="notas"
              defaultValue={initialValues.notas}
              className="min-h-[90px] w-full rounded-md border px-3 py-2 text-sm"
              placeholder="Opcional"
            />
          </div>
        </div>

        <div className="mt-4 flex gap-2">
          <SubmitButton label="Guardar" />
          <Link href={cancelHref} className="rounded-md border px-4 py-2 text-sm hover:bg-slate-50">
            Cancelar
          </Link>
        </div>
      </form>
    </div>
  );
}