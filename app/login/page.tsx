import { ensureInitAdmin } from "@/lib/init-admin";
import { LoginForm } from "@/components/LoginForm";
import { getSessionUser } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function LoginPage() {
  await ensureInitAdmin();
  const user = await getSessionUser();
  if (user) redirect("/voters");

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 px-4 py-12">
      <div className="w-full max-w-md">
        {/* Logo/Header Card */}
        <div className="mb-6 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 shadow-lg">
            <svg className="h-9 w-9 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-slate-900">Control Votantes</h1>
          <p className="mt-2 text-sm text-slate-600">Sistema de gestión electoral</p>
        </div>

        {/* Login Form Card */}
        <div className="rounded-2xl bg-white/80 p-8 shadow-xl backdrop-blur-sm">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-slate-900">Iniciar sesión</h2>
            <p className="mt-1 text-sm text-slate-600">Ingresa tus credenciales para continuar</p>
          </div>

          <LoginForm />
        </div>

        {/* Info Footer */}
      

        {/* Copyright */}
        <div className="mt-6 text-center text-xs text-slate-500">
          <p>© 2025 Control Votantes. Todos los derechos reservados.</p>
        </div>
      </div>
    </div>
  );
}