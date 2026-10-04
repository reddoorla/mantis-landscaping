import { env } from "$env/dynamic/private";
import { isHttpError } from "@sveltejs/kit";
import { createIngestAction } from "@reddoorla/maintenance/forms";
import { loadPage } from "$lib/page-load";
import { createClient, isPlaceholderRepo } from "$lib/prismicio";
import { CONTACT_UID } from "$lib/routes";
import { replyCopyFor } from "$lib/server/reply-copy";
import type { Actions, PageServerLoad } from "./$types";

export const prerender = false;

export const load: PageServerLoad = async ({ fetch, cookies }) => {
  const fallback = { formTs: Date.now(), title: "Contact Us", page: null, context: {} };
  if (isPlaceholderRepo) return fallback;
  try {
    const loaded = await loadPage(createClient({ fetch, cookies }), CONTACT_UID);
    return { ...loaded, formTs: Date.now() };
  } catch (err) {
    if (!(isHttpError(err) && err.status === 404)) {
      console.error("contact-us: Prismic page load failed; serving the form without it", err);
    }
    return fallback;
  }
};

export const actions: Actions = {
  default: createIngestAction({
    formType: "contact",
    getConfig: () => ({
      url: env.FORMS_INGEST_URL,
      token: env.FORMS_INGEST_TOKEN,
    }),
    buildPayload: async (form, event) => ({
      name: form.get("name")?.toString(),
      email: form.get("email")?.toString(),
      phone: form.get("phone")?.toString(),
      message: form.get("message")?.toString(),
      sourceUrl: event.url.href,
      testMode: form.get("testMode")?.toString() === "true" || undefined,
      _reply: await replyCopyFor(event, "contact"),
    }),
  }),
};
