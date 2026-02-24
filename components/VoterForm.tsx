"use client";

import { useFormState, useFormStatus } from "react-dom";
import Link from "next/link";
import { COLEGIOS } from "@/lib/colegios";

type LeaderOption = { id: number; nombresLider: string; apellidosLider: string };

type VoterValues = {
  cedulaVotante: string;
  nombres: string;
  apellidos: string;
  dondeVota: string;
  mesaVotacion: string;
  leaderId: string; // '' or 'none' or id
};

type FormState =
  | {
      error?: string;
    }
  | undefined;

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

export function VoterForm({
  title,
  initialValues,
  leaders,
  action,
  cancelHref,
  canChooseOrigen = false
}: {
  title: string;
  initialValues: VoterValues;
  leaders: LeaderOption[];
  action: (prevState: FormState, formData: FormData) => Promise<FormState>;
  cancelHref: string;
  canChooseOrigen?: boolean;
}) {
  const [state, formAction] = useFormState<FormState, FormData>(action, undefined);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">{title}</h1>

          <div className="text-xs text-red-500">
      DEBUG VOTER canChooseOrigen: {String(canChooseOrigen)}
    </div>

      <form action={formAction} className="rounded-lg border bg-white p-4 shadow-sm">
        {state?.error ? (
          <div className="mb-3 rounded-md bg-red-50 p-2 text-sm text-red-700">{state.error}</div>
        ) : null}

        <div className="grid gap-3 md:grid-cols-3">
          {canChooseOrigen ? (
            <div className="space-y-1 md:col-span-3">
              <label className="text-sm font-medium">Tipo de registro</label>
              <select name="origen" defaultValue="nuevo" className="w-full rounded-md border px-3 py-2 text-sm">
                <option value="nuevo">Nuevo</option>
                <option value="precargado">Precargado</option>
              </select>
            </div>
          ) : (
            <input type="hidden" name="origen" value="nuevo" />
          )}

          <div className="space-y-1">
            <label className="text-sm font-medium">Cédula</label>
            <input name="cedulaVotante" defaultValue={initialValues.cedulaVotante} className="w-full rounded-md border px-3 py-2 text-sm" />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium">Nombres</label>
            <input name="nombres" defaultValue={initialValues.nombres} className="w-full rounded-md border px-3 py-2 text-sm" />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium">Apellidos</label>
            <input
              name="apellidos"
              defaultValue={initialValues.apellidos}
              className="w-full rounded-md border px-3 py-2 text-sm"
            />
          </div>

          <div className="space-y-1 md:col-span-2">
            <label className="text-sm font-medium">Colegio / Puesto de votación</label>
            <input
              name="dondeVota"
              list="colegios"
              defaultValue={initialValues.dondeVota}
              className="w-full rounded-md border px-3 py-2 text-sm"
              placeholder="Escribe para buscar"
            />
            <datalist id="colegios">
              {COLEGIOS.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
            <div className="text-xs text-slate-500">Puedes escribir para filtrar la lista.</div>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium">Mesa</label>
            <input
              name="mesaVotacion"
              defaultValue={initialValues.mesaVotacion}
              className="w-full rounded-md border px-3 py-2 text-sm"
              placeholder="Opcional"
            />
          </div>

          <div className="space-y-1 md:col-span-3">
            <label className="text-sm font-medium">Líder</label>
            <select name="leaderId" defaultValue={initialValues.leaderId} className="w-full rounded-md border px-3 py-2 text-sm">
              <option value="none">Independiente (sin líder)</option>
              {leaders.map((l) => (
                <option key={l.id} value={String(l.id)}>
                  {l.nombresLider} {l.apellidosLider}
                </option>
              ))}
            </select>
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