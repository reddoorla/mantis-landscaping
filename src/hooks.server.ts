import type { Handle } from "@sveltejs/kit";
import { redirectFor } from "$lib/redirects";

export const handle: Handle = async ({ event, resolve }) => {
  const target = redirectFor(event.url.pathname);
  const response = target
    ? new Response(null, { status: 301, headers: { location: `${target}${event.url.search}` } })
    : await resolve(event);

  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "SAMEORIGIN");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");

  return response;
};
