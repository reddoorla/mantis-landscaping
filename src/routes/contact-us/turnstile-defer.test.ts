import { describe, it, expect, vi, afterEach } from "vitest";
import { render, cleanup, fireEvent } from "@testing-library/svelte";
import type { TurnstileApi } from "$lib/turnstile";

const appState = vi.hoisted(() => ({
  page: { url: new URL("https://mantislandscaping.com/contact-us") },
}));
vi.mock("$app/state", () => appState);
vi.mock("$app/forms", () => ({ enhance: () => ({ destroy() {} }) }));
vi.mock("$env/dynamic/public", () => ({ env: { PUBLIC_TURNSTILE_SITE_KEY: "site-key" } }));

const { default: ContactPage } = await import("./+page.svelte");

afterEach(() => {
  cleanup();
  delete window.turnstile;
});

describe("the contact page's Turnstile widgets", () => {
  it("the signup's Turnstile mounts on first focus, not at load", async () => {
    const api = {
      render: vi.fn<TurnstileApi["render"]>(() => "widget"),
      remove: vi.fn<TurnstileApi["remove"]>(),
      reset: vi.fn<TurnstileApi["reset"]>(),
    };
    window.turnstile = api;
    const { container } = render(ContactPage, {
      props: { data: { formTs: 1, page: null, context: {} }, form: null } as never,
    });

    await vi.waitFor(() => expect(api.render).toHaveBeenCalledTimes(1));
    const [contactForm, signupForm] = [...container.querySelectorAll("form")];
    expect(contactForm.contains(api.render.mock.calls[0][0] as Node)).toBe(true);
    expect(signupForm.querySelector(".cf-turnstile")).not.toBeNull();

    await fireEvent.focusIn(signupForm.querySelector('[name="email"]') as HTMLElement);
    await vi.waitFor(() => expect(api.render).toHaveBeenCalledTimes(2));
    expect(signupForm.contains(api.render.mock.calls[1][0] as Node)).toBe(true);
  });
});
