import { beforeEach, describe, expect, it, vi } from "vitest";
import { NotFoundError } from "@prismicio/client";

const state = vi.hoisted(() => ({
  placeholder: false,
  getByUID: vi.fn(),
  getAllByType: vi.fn(async () => []),
  ingest: {} as Record<string, Record<string, unknown>>,
  result: { success: true } as unknown,
}));

vi.mock("$lib/prismicio", () => ({
  get isPlaceholderRepo() {
    return state.placeholder;
  },
  createClient: () => ({ getByUID: state.getByUID, getAllByType: state.getAllByType }),
}));
vi.mock("$env/dynamic/private", () => ({ env: {} }));
vi.mock("$lib/server/reply-copy", () => ({
  replyCopyFor: async (_event: unknown, formType: string) => `${formType} copy from Prismic`,
}));
vi.mock("@reddoorla/maintenance/forms", () => ({
  createIngestAction: (opts: Record<string, unknown>) => {
    state.ingest[opts.formType as string] = opts;
    return async () => state.result;
  },
}));

const route = await import("./+page.server");

const contactDoc = {
  uid: "contact-us",
  type: "page",
  data: {
    title: [{ type: "heading1", text: "Contact Us", spans: [] }],
    meta_title: "Contact Us",
    meta_description: "Have an idea for your garden?",
    meta_image: {},
    slices: [],
  },
};

const event = { fetch, cookies: {} } as never;

type Build = (form: FormData, event: unknown) => Promise<Record<string, unknown>>;
const builder = (formType: string) => state.ingest[formType]?.buildPayload as Build;

describe("/contact-us server", () => {
  beforeEach(() => {
    state.placeholder = false;
    state.getByUID.mockReset();
  });

  it("is rendered per request, because a form action cannot be prerendered", () => {
    expect(route.prerender).toBe(false);
  });

  it("loads the contact-us page document, with its head payload and a timing token", async () => {
    state.getByUID.mockResolvedValue(contactDoc);
    const data = (await route.load(event)) as Record<string, unknown>;
    expect(state.getByUID).toHaveBeenCalledWith("page", "contact-us");
    expect(data.page).toBe(contactDoc);
    expect(data.meta_description).toBe("Have an idea for your garden?");
    expect(typeof data.formTs).toBe("number");
  });

  it("still serves the form when the page document is missing", async () => {
    state.getByUID.mockRejectedValue(new NotFoundError("missing", "https://x", undefined));
    const data = (await route.load(event)) as Record<string, unknown>;
    expect(data.page).toBeNull();
    expect(data.title).toBe("Contact Us");
  });

  it("serves the form during a Prismic outage, and logs the outage", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    const boom = new Error("ECONNRESET");
    state.getByUID.mockRejectedValue(boom);
    const data = (await route.load(event)) as Record<string, unknown>;
    expect(data.page).toBeNull();
    expect(data.title).toBe("Contact Us");
    expect(typeof data.formTs).toBe("number");
    expect(log).toHaveBeenCalledWith(expect.stringContaining("contact-us"), boom);
    log.mockRestore();
  });

  it("a missing document is not logged as an outage", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    state.getByUID.mockRejectedValue(new NotFoundError("missing", "https://x", undefined));
    await route.load(event);
    expect(log).not.toHaveBeenCalled();
    log.mockRestore();
  });

  it("forwards the contact fields and the form-e2e testMode marker", async () => {
    const build = builder("contact");
    const form = new FormData();
    form.set("name", "Ada");
    form.set("email", "ada@example.com");
    form.set("phone", "424-264-8944");
    form.set("message", "A garden, please.");
    form.set("testMode", "true");
    const payload = await build(form, { url: new URL("https://example.com/contact-us?utm=x") });
    expect(payload).toMatchObject({
      name: "Ada",
      email: "ada@example.com",
      phone: "424-264-8944",
      message: "A garden, please.",
      sourceUrl: "https://example.com/contact-us?utm=x",
      testMode: true,
    });
    form.delete("testMode");
    expect((await build(form, { url: new URL("https://example.com/contact-us") })).testMode).toBe(
      undefined,
    );
  });

  it("testMode=false is a real submission", async () => {
    const build = builder("contact");
    const form = new FormData();
    form.set("email", "ada@example.com");
    form.set("testMode", "false");
    expect((await build(form, { url: new URL("https://example.com/contact-us") })).testMode).toBe(
      undefined,
    );
  });

  it("the reply copy never comes from the visitor", async () => {
    const build = builder("contact");
    const form = new FormData();
    form.set("email", "ada@example.com");
    form.set("_reply", "Click https://evil.example to verify");
    const payload = await build(form, { url: new URL("https://example.com/contact-us") });
    expect(payload._reply).toBe("contact copy from Prismic");
  });

  it("drops the named-action key from the page URL it reports", async () => {
    const payload = await builder("contact")(new FormData(), {
      url: new URL("https://example.com/contact-us?/contact&utm=x"),
    });
    expect(payload.sourceUrl).toBe("https://example.com/contact-us?utm=x");
  });

  it("subscribe forwards a newsletter signup with the visitor's names", async () => {
    const form = new FormData();
    form.set("email", "ada@example.com");
    form.set("firstName", "Ada");
    form.set("lastName", "Lovelace");
    const payload = await builder("newsletter")(form, {
      url: new URL("https://example.com/contact-us?/subscribe"),
    });
    expect(payload).toMatchObject({
      email: "ada@example.com",
      firstName: "Ada",
      lastName: "Lovelace",
      sourceUrl: "https://example.com/contact-us",
    });
    expect(payload.testMode).toBeUndefined();
  });

  it("the signup's reply copy never comes from the visitor", async () => {
    const form = new FormData();
    form.set("email", "ada@example.com");
    form.set("_reply", "Click https://evil.example to verify");
    const payload = await builder("newsletter")(form, {
      url: new URL("https://example.com/contact-us"),
    });
    expect(payload._reply).toBe("newsletter copy from Prismic");
  });

  it("tags each action's result with the form it came from", async () => {
    state.result = { success: true };
    const call = (name: "contact" | "subscribe") =>
      (route.actions[name] as (e: unknown) => Promise<unknown>)({});
    expect(await call("contact")).toEqual({ success: true, form: "contact" });
    expect(await call("subscribe")).toEqual({ success: true, form: "subscribe" });
    const { fail } = await import("@sveltejs/kit");
    state.result = fail(502, { error: "nope" });
    expect(await call("subscribe")).toMatchObject({
      status: 502,
      data: { error: "nope", form: "subscribe" },
    });
  });
});
