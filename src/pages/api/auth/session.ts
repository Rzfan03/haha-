import type { APIRoute } from "astro";

export const GET: APIRoute = async ({ locals }) => {
  return new Response(JSON.stringify({ user: locals.user }), {
    headers: { "Content-Type": "application/json" },
  });
};
