import { env } from "$env/dynamic/private";
import { fail, isHttpError, type RequestEvent } from "@sveltejs/kit";
import { createIngestAction, type IngestActionData } from "@reddoorla/maintenance/forms";
import { loadPage } from "$lib/page-load";
import { createClient, isPlaceholderRepo } from "$lib/prismicio";
import { CONTACT_UID } from "$lib/routes";
import { replyCopyFor } from "$lib/server/reply-copy";
import { pageUrl } from "$lib/server/page-url";
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

const ingestConfig = () => ({
  url: env.FORMS_INGEST_URL,
  token: env.FORMS_INGEST_TOKEN,
});

type FormId = "contact" | "subscribe";

function tagged(id: FormId, action: (event: RequestEvent) => Promise<IngestActionData>) {
  return async (event: RequestEvent) => {
    const result = await action(event);
    if ("success" in result) return { ...result, form: id };
    return fail(result.status, { ...result.data, form: id });
  };
}

export const actions: Actions = {
  contact: tagged(
    "contact",
    createIngestAction({
      formType: "contact",
      getConfig: ingestConfig,
      buildPayload: async (form, event) => ({
        name: form.get("name")?.toString(),
        email: form.get("email")?.toString(),
        phone: form.get("phone")?.toString(),
        message: form.get("message")?.toString(),
        sourceUrl: pageUrl(event.url),
        testMode: form.get("testMode")?.toString() === "true" || undefined,
        _reply: await replyCopyFor(event, "contact"),
      }),
    }),
  ),
  subscribe: tagged(
    "subscribe",
    createIngestAction({
      formType: "newsletter",
      getConfig: ingestConfig,
      buildPayload: async (form, event) => ({
        email: form.get("email")?.toString(),
        firstName: form.get("firstName")?.toString(),
        lastName: form.get("lastName")?.toString(),
        sourceUrl: pageUrl(event.url),
        testMode: form.get("testMode")?.toString() === "true" || undefined,
        _reply: await replyCopyFor(event, "newsletter"),
      }),
      errorMessage: "Something went wrong signing you up. Please try again.",
    }),
  ),
};
