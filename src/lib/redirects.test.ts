import { describe, expect, it } from "vitest";
import { handle } from "../hooks.server";
import { redirectFor } from "./redirects";

const run = async (path: string) => {
  const url = new URL(`https://mantislandscaping.com${path}`);
  let resolved = false;
  const response = await handle({
    event: { url } as never,
    resolve: async () => {
      resolved = true;
      return new Response("page", { status: 200 });
    },
  });
  return { response, resolved };
};

describe("permanent redirects for the Blux paths folded into one page", () => {
  it.each(["/ediblegardens", "/projects/ediblegardens", "/ediblegardens/"])(
    "%s answers 301 to /projects/edible-gardens",
    async (path) => {
      const { response, resolved } = await run(path);
      expect(response.status).toBe(301);
      expect(response.headers.get("location")).toBe("/projects/edible-gardens");
      expect(resolved).toBe(false);
    },
  );

  it("keeps the query string across the redirect", async () => {
    const { response } = await run("/ediblegardens?utm_source=instagram");
    expect(response.headers.get("location")).toBe("/projects/edible-gardens?utm_source=instagram");
  });

  it.each(["/projects/edible-gardens", "/projects/water-wise-gardens", "/", "/contact-us"])(
    "%s is served, not redirected",
    async (path) => {
      expect(redirectFor(path)).toBeNull();
      const { response, resolved } = await run(path);
      expect(resolved).toBe(true);
      expect(response.status).toBe(200);
      expect(response.headers.get("x-content-type-options")).toBe("nosniff");
    },
  );

  it("still sets the security headers on a redirect", async () => {
    const { response } = await run("/ediblegardens");
    expect(response.headers.get("x-frame-options")).toBe("SAMEORIGIN");
  });
});
