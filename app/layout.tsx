import "./globals.css";
import type { Metadata } from "next";
import { getSessionUser } from "@/lib/auth";
import { Navbar } from "@/components/Navbar";

export const metadata: Metadata = {
  title: "Control de Votantes",
  description: "MVP - Control personal de votantes"
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();

  return (
    <html lang="es">
      <body>
        <Navbar user={user} />
        <main className="mx-auto w-full max-w-6xl px-4 py-6">{children}</main>
      </body>
    </html>
  );
}
