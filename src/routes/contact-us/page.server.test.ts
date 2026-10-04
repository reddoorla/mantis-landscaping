import { beforeEach, describe, expect, it, vi } from "vitest";
import { NotFoundError } from "@prismicio/client";

const state = vi.hoisted(() => ({
  placeholder: false,
  getByUID: vi.fn(),
  getAllByType: vi.fn(async () => []),
  ingestOptions: undefined as undefined | Record<string, unknown>,
}));

vi.mock("$lib/prismicio", () => ({
  get isPlaceholderRepo() {
    return state.placeholder;
  },
  createClient: () => ({ getByUID: state.getByUID, getAllByType: state.getAllByType }),
}));
vi.mock("$env/dynamic/private", () => ({ env: {} }));
vi.mock("$lib/server/reply-copy", () => ({ replyCopyFor: async () => undefined }));
vi.mock("@reddoorla/maintenance/forms", () => ({
  createIngestAction: (opts: Record<string, unknown>) => {
    state.ingestOptions = opts;
    return async () => ({});
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

  it("does not hide an outage behind the fallback", async () => {
    const boom = new Error("ECONNRESET");
    state.getByUID.mockRejectedValue(boom);
    await expect(route.load(event)).rejects.toBe(boom);
  });

  it("forwards the contact fields and the form-e2e testMode marker", async () => {
    const build = state.ingestOptions?.buildPayload as (
      form: FormData,
      event: unknown,
    ) => Promise<Record<string, unknown>>;
    expect(state.ingestOptions?.formType).toBe("contact");
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
});
