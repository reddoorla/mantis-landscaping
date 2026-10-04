import { describe, it, expect, vi, afterEach } from "vitest";
import { render, cleanup, within } from "@testing-library/svelte";

vi.mock("$app/forms", () => ({ enhance: () => ({ destroy() {} }) }));
vi.mock("$env/dynamic/public", () => ({ env: { PUBLIC_TURNSTILE_SITE_KEY: "0xSITEKEY" } }));
vi.mock("$lib/turnstile", () => ({ loadTurnstile: () => new Promise(() => {}) }));

const { default: ContactPage } = await import("./+page.svelte");

afterEach(() => cleanup());

const page = {
  uid: "contact-us",
  type: "page",
  data: {
    title: [{ type: "heading1", text: "Contact Us", spans: [] }],
    slices: [
      {
        slice_type: "page_title",
        variation: "default",
        id: "t",
        primary: {
          heading: [{ type: "heading1", text: "Contact Us", spans: [] }],
          heading_style: "display",
          body: [],
          background: "gold-deep",
        },
        items: [],
      },
      {
        slice_type: "text_block",
        variation: "default",
        id: "b",
        primary: {
          heading: [{ type: "heading2", text: "Have an idea for your garden?", spans: [] }],
          heading_style: "display",
          body: [
            { type: "paragraph", text: "Send us a message through the form below.", spans: [] },
          ],
          size: "body",
          align: "left",
          background: "light",
          background_image: {},
          buttons: [],
        },
        items: [],
      },
    ],
  },
};

const mount = (withPage: boolean) =>
  render(ContactPage, {
    props: {
      data: { formTs: 1_700_000_000_000, page: withPage ? page : null, context: {} },
      form: null,
    } as never,
  });

describe("/contact-us", () => {
  it("renders the Prismic bands, then the form, with exactly one h1", () => {
    const { container } = mount(true);
    const view = within(container);
    expect(view.getByRole("heading", { level: 1 }).textContent).toContain("Contact Us");
    expect(container.querySelectorAll("h1")).toHaveLength(1);
    const intro = view.getByRole("heading", { level: 2, name: "Have an idea for your garden?" });
    const form = container.querySelector("form");
    expect(form).not.toBeNull();
    expect(intro.compareDocumentPosition(form!) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it("keeps an h1 and the form when the Prismic page is missing", () => {
    const { container } = mount(false);
    expect(within(container).getByRole("heading", { level: 1 }).textContent).toContain(
      "Contact Us",
    );
    expect(container.querySelector("form")).not.toBeNull();
  });

  it("posts the labelled fields with the honeypot, the timing token and a Turnstile mount", () => {
    const { container } = mount(true);
    const form = container.querySelector("form") as HTMLFormElement;
    const view = within(form);
    expect(form.getAttribute("method")).toBe("POST");
    for (const label of ["Name", "Email", "Phone", "Message"])
      expect(view.getByLabelText(new RegExp(label))).toBeTruthy();
    expect((view.getByLabelText(/Email/) as HTMLInputElement).type).toBe("email");
    expect(form.querySelector('input[name="ts"]')?.getAttribute("value")).toBe("1700000000000");
    const honeypot = form.querySelector('input[name="bot-field"]');
    expect(honeypot?.getAttribute("aria-hidden")).toBe("true");
    expect(honeypot?.getAttribute("tabindex")).toBe("-1");
    expect(form.querySelector(".cf-turnstile")).not.toBeNull();
  });
});
