"use client";

import { useFormState, useFormStatus } from "react-dom";
import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import { COLEGIOS } from "@/lib/colegios";

type LeaderOption = { id: number; nombresLider: string; apellidosLider: string };

type VoterValues = {
  cedulaVotante: string;
  nombres: string;
  apellidos: string;
  dondeVota: string;
  mesaVotacion: string;
  leaderId: string;
};

type FormState = { error?: string } | undefined;

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

/* ── Searchable Leader Picker ─────────────────────────────────────────── */
function LeaderPicker({
  leaders,
  defaultValue
}: {
  leaders: LeaderOption[];
  defaultValue: string;
}) {
  const INDEPENDENT = { id: -1, label: "Independiente (sin líder)" };

  function labelFor(id: string) {
    if (!id || id === "none" || id === "") return INDEPENDENT.label;
    const l = leaders.find((l) => String(l.id) === id);
    return l ? `${l.nombresLider} ${l.apellidosLider}` : INDEPENDENT.label;
  }

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(defaultValue || "none");
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close on outside click
  useEffect(() => {
    function handle(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery("");
      }
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  const normalized = query.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  const filtered = leaders.filter((l) => {
    const full = `${l.nombresLider} ${l.apellidosLider}`
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
    return full.includes(normalized);
  });

  function select(value: string) {
    setSelected(value);
    setOpen(false);
    setQuery("");
  }

  const selectedLabel = labelFor(selected);

  return (
    <div ref={containerRef} className="relative">
      {/* Hidden input for form submission */}
      <input type="hidden" name="leaderId" value={selected} />

      {/* Trigger button */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm transition-all hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/20"
      >
        <span className="flex items-center gap-2 truncate">
          {selected === "none" || selected === "" ? (
            <svg className="h-4 w-4 flex-shrink-0 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7a4 4 0 11-8 0 4 4 0 018 0zM9 14a6 6 0 00-6 6v1h12v-1a6 6 0 00-6-6z" />
            </svg>
          ) : (
            <svg className="h-4 w-4 flex-shrink-0 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          )}
          <span className={selected === "none" || selected === "" ? "text-slate-500" : "text-slate-900"}>
            {selectedLabel}
          </span>
        </span>
        <svg
          className={`h-4 w-4 flex-shrink-0 text-slate-400 transition-transform ${open ? "rotate-180" : ""}`}
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute z-50 mt-1 w-full rounded-md border border-slate-200 bg-white shadow-lg">
          {/* Search input */}
          <div className="border-b border-slate-100 p-2">
            <div className="relative">
              <svg className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar líder..."
                className="w-full rounded-md border border-slate-200 py-1.5 pl-8 pr-3 text-sm focus:border-slate-400 focus:outline-none"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>

          {/* Options list */}
          <ul className="max-h-52 overflow-y-auto py-1">
            {/* Independiente option — only show when no query */}
            {!query && (
              <li>
                <button
                  type="button"
                  onClick={() => select("none")}
                  className={`flex w-full items-center gap-2 px-3 py-2 text-sm transition-colors hover:bg-slate-50 ${
                    selected === "none" ? "bg-slate-100 font-medium text-slate-900" : "text-slate-600"
                  }`}
                >
                  <svg className="h-4 w-4 flex-shrink-0 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7a4 4 0 11-8 0 4 4 0 018 0zM9 14a6 6 0 00-6 6v1h12v-1a6 6 0 00-6-6z" />
                  </svg>
                  Independiente (sin líder)
                  {selected === "none" && (
                    <svg className="ml-auto h-4 w-4 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>
              </li>
            )}

            {filtered.map((l) => {
              const value = String(l.id);
              const isSelected = selected === value;
              const fullName = `${l.nombresLider} ${l.apellidosLider}`;
              return (
                <li key={l.id}>
                  <button
                    type="button"
                    onClick={() => select(value)}
                    className={`flex w-full items-center gap-2 px-3 py-2 text-sm transition-colors hover:bg-slate-50 ${
                      isSelected ? "bg-slate-100 font-medium text-slate-900" : "text-slate-700"
                    }`}
                  >
                    <svg className="h-4 w-4 flex-shrink-0 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <span className="truncate">{fullName}</span>
                    {isSelected && (
                      <svg className="ml-auto h-4 w-4 flex-shrink-0 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </button>
                </li>
              );
            })}

            {filtered.length === 0 && (
              <li className="px-3 py-4 text-center text-sm text-slate-400">
                Sin resultados para "{query}"
              </li>
            )}
          </ul>

          {/* Footer count */}
          <div className="border-t border-slate-100 px-3 py-1.5 text-xs text-slate-400">
            {query ? `${filtered.length} resultado${filtered.length !== 1 ? "s" : ""}` : `${leaders.length} líderes`}
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Main Form ────────────────────────────────────────────────────────── */
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
      <form action={formAction} className="rounded-lg border bg-white p-4 shadow-sm">
        {state?.error && (
          <div className="mb-3 rounded-md bg-red-50 p-2 text-sm text-red-700">{state.error}</div>
        )}

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
            <input name="apellidos" defaultValue={initialValues.apellidos} className="w-full rounded-md border px-3 py-2 text-sm" />
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

          {/* Searchable leader picker */}
          <div className="space-y-1 md:col-span-3">
            <label className="text-sm font-medium">Líder</label>
            <LeaderPicker leaders={leaders} defaultValue={initialValues.leaderId} />
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