import { describe, expect, it, vi } from "vitest";

vi.mock("$app/environment", () => ({ building: true, browser: false, dev: false }));

const { handle } = await import("./hooks.server");

describe("redirects while prerendering", () => {
  it("a prerendered redirect carries no query string", async () => {
    const response = await handle({
      event: { url: new URL("https://mantislandscaping.com/ediblegardens?utm_source=x") } as never,
      resolve: async () => new Response("page"),
    });
    expect(response.status).toBe(301);
    expect(response.headers.get("location")).toBe("/projects/edible-gardens");
  });
});
