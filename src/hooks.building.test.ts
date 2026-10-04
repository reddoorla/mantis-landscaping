import { describe, expect, it, vi } from "vitest";

vi.mock("$app/environment", () => ({ building: true, browser: false, dev: false }));

const { handle } = await import("./hooks.server");

describe("the redirect hook while prerendering", () => {
  it("never reads the query string, which SvelteKit forbids during prerender", async () => {
    const url = new URL("https://mantislandscaping.com/ediblegardens");
    Object.defineProperty(url, "search", {
      get() {
        throw new Error("Cannot access url.search on a page with prerendering enabled");
      },
    });
    const response = await handle({
      event: { url } as never,
      resolve: async () => new Response("page"),
    });
    expect(response.status).toBe(301);
    expect(response.headers.get("location")).toBe("/projects/edible-gardens");
  });
});
