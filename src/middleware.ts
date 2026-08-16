import { defineMiddleware } from "astro:middleware";
import { getUserFromCookies } from "./lib/auth";

const PROTECTED_POST = [
  "/api/upload",
  "/api/like",
  "/api/bookmark",
  "/api/comment",
  "/api/follow",
  "/api/account",
  "/api/admin",
];

export const onRequest = defineMiddleware(async (context, next) => {
  const user = await getUserFromCookies(context.cookies);
  context.locals.user = user;
  context.locals.userId = user?.id ?? null;

  const { pathname } = context.url;
  const isApi = pathname.startsWith("/api/");
  const isProtected = PROTECTED_POST.some((p) => pathname === p || pathname.startsWith(`${p}/`));

  if (isApi && isProtected && context.request.method !== "GET" && !user) {
    return new Response(JSON.stringify({ error: "Login dulu untuk melanjutkan" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  return next();
});
