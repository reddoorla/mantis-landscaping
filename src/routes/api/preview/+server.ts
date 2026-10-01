import { redirectToPreviewURL } from "@prismicio/svelte/kit";
import { createClient, linkResolver } from "$lib/prismicio";
import type { RequestHandler } from "./$types";

export const GET: RequestHandler = async ({ fetch, request, cookies }) => {
  const client = createClient({ fetch });

  return await redirectToPreviewURL({
    client: {
      resolvePreviewURL: (args) => client.resolvePreviewURL({ ...args, linkResolver }),
    },
    request,
    cookies,
  });
};
