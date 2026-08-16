import type { APIRoute } from "astro";
import { destroySession } from "../../../lib/auth";

export const POST: APIRoute = async ({ cookies }) => {
  await destroySession(cookies);
  const url = new URL("/", import.meta.env.SITE || "http://localhost:4321");
  return Response.redirect(url, 303);
};
