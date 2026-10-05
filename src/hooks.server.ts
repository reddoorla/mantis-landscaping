import type { Handle } from "@sveltejs/kit";
import { building } from "$app/environment";
import { redirectFor } from "$lib/redirects";
import { actionHref } from "$lib/action-url";
import { CONTACT_UID } from "$lib/routes";

const CONTACT_PATH = `/${CONTACT_UID}`;

function unnamedContactPost(url: URL, method: string): boolean {
  return (
    method === "POST" &&
    url.pathname === CONTACT_PATH &&
    ![...url.searchParams.keys()].some((key) => key.startsWith("/"))
  );
}

export const handle: Handle = async ({ event, resolve }) => {
  const target = redirectFor(event.url.pathname);
  const query = building ? "" : event.url.search;
  const response = target
    ? new Response(null, { status: 301, headers: { location: `${target}${query}` } })
    : unnamedContactPost(event.url, event.request.method)
      ? new Response(null, {
          status: 307,
          headers: { location: `${CONTACT_PATH}${actionHref(event.url.search, "contact")}` },
        })
      : await resolve(event);

  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "SAMEORIGIN");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");

  return response;
};
