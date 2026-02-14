import { NextResponse, type NextRequest } from "next/server";
import { getSessionUser } from "./auth";

export async function requireRouteAuth(request: NextRequest) {
  const user = await getSessionUser();
  if (!user) {
    const url = new URL("/login", request.url);
    return { user: null, response: NextResponse.redirect(url) };
  }
  return { user, response: null };
}
