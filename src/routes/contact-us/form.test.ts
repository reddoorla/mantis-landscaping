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

const mount = (withPage: boolean, form: Record<string, unknown> | null = null) =>
  render(ContactPage, {
    props: {
      data: { formTs: 1_700_000_000_000, page: withPage ? page : null, context: {} },
      form,
    } as never,
  });

const forms = (container: HTMLElement) => [...container.querySelectorAll("form")];

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

  it("the contact form is the first form and owns the first email field", () => {
    const { container } = mount(true);
    const [contact, signup] = forms(container);
    expect(contact.getAttribute("action")).toBe("?/contact");
    expect(signup.getAttribute("action")).toBe("?/subscribe");
    expect(contact.contains(container.querySelector('[name="email"]'))).toBe(true);
  });

  it("the signup posts email, names, honeypot, timing token and a Turnstile mount", () => {
    const { container } = mount(true);
    const signup = forms(container)[1];
    const view = within(signup);
    expect(signup.getAttribute("method")).toBe("POST");
    expect((view.getByLabelText(/Email/) as HTMLInputElement).type).toBe("email");
    expect((view.getByLabelText(/Email/) as HTMLInputElement).required).toBe(true);
    expect((view.getByLabelText(/First name/) as HTMLInputElement).name).toBe("firstName");
    expect((view.getByLabelText(/Last name/) as HTMLInputElement).name).toBe("lastName");
    expect(signup.querySelector('input[name="ts"]')?.getAttribute("value")).toBe("1700000000000");
    expect(signup.querySelector('input[name="bot-field"]')?.getAttribute("aria-hidden")).toBe(
      "true",
    );
    expect(signup.querySelector(".cf-turnstile")).not.toBeNull();
    expect(
      within(container).getByRole("heading", { level: 2, name: "Mantis Monthly Newsletter" }),
    ).toBeTruthy();
    expect(container.querySelector("#newsletter")?.contains(signup)).toBe(true);
  });

  it("a signup success leaves the contact form in place", () => {
    const { container } = mount(true, { success: true, form: "subscribe" });
    const remaining = forms(container);
    expect(remaining).toHaveLength(1);
    expect(remaining[0].getAttribute("action")).toBe("?/contact");
    const status = within(container).getByRole("status");
    expect(container.querySelector("#newsletter")?.contains(status)).toBe(true);
  });

  it("a contact success leaves the signup in place", () => {
    const { container } = mount(true, { success: true, form: "contact" });
    const remaining = forms(container);
    expect(remaining).toHaveLength(1);
    expect(remaining[0].getAttribute("action")).toBe("?/subscribe");
  });

  it("a contact error stays with the contact form", () => {
    const { container } = mount(true, { error: "Something went wrong", form: "contact" });
    const [contact, signup] = forms(container);
    expect(within(contact).getByRole("alert").textContent).toContain("Something went wrong");
    expect(within(signup).queryByRole("alert")).toBeNull();
  });

  it("a signup error stays with the signup form", () => {
    const { container } = mount(true, { error: "Signup failed", form: "subscribe" });
    const [contact, signup] = forms(container);
    expect(within(signup).getByRole("alert").textContent).toContain("Signup failed");
    expect(within(contact).queryByRole("alert")).toBeNull();
  });
});
