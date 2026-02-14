import { redirect } from "next/navigation";
import { getSessionUser } from "./auth";

export async function requireAuth() {
  const user = await getSessionUser();
  if (!user) {
    redirect("/login");
  }
  return user;
}
