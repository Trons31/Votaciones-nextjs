"use client";

import { deleteLeaderAction } from "@/app/actions/leaders";

export function DeleteLeaderButton({ 
  leaderId, 
  leaderName 
}: { 
  leaderId: number; 
  leaderName: string;
}) {
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    if (!confirm(`¿Estás seguro de eliminar al líder ${leaderName}?`)) {
      e.preventDefault();
    }
  };

  return (
    <form action={deleteLeaderAction.bind(null, leaderId)} onSubmit={handleSubmit}>
      <button
        type="submit"
        className="inline-flex items-center gap-2 rounded-lg border-2 border-red-300 bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition-all hover:bg-red-700 hover:border-red-400 shadow-md"
      >
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
        Eliminar Líder
      </button>
    </form>
  );
}