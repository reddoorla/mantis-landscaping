import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { handle } from "../hooks.server";
import { PERMANENT_REDIRECTS, redirectFor } from "./redirects";

function netlifyRedirects() {
  const toml = readFileSync(resolve(process.cwd(), "netlify.toml"), "utf8");
  return toml
    .split("[[redirects]]")
    .slice(1)
    .map((block) => {
      const field = (key: string) =>
        new RegExp(`^\\s*${key}\\s*=\\s*"?([^"\\n]+?)"?\\s*$`, "m").exec(block)?.[1];
      return {
        from: field("from"),
        to: field("to"),
        status: field("status"),
        force: field("force"),
        rawStatus: new RegExp(`^\\s*status\\s*=\\s*(.+?)\\s*$`, "m").exec(block)?.[1],
        rawForce: new RegExp(`^\\s*force\\s*=\\s*(.+?)\\s*$`, "m").exec(block)?.[1],
      };
    });
}

const run = async (path: string) => {
  const url = new URL(`https://mantislandscaping.com${path}`);
  let resolved = false;
  const response = await handle({
    event: { url, request: new Request(url) } as never,
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

  it.each(["/contact", "/contact/"])("%s answers 301 to /contact-us", async (path) => {
    const { response, resolved } = await run(path);
    expect(response.status).toBe(301);
    expect(response.headers.get("location")).toBe("/contact-us");
    expect(resolved).toBe(false);
  });

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

  it("netlify.toml forces the same 301s, so a prerendered file cannot shadow one", () => {
    const declared = netlifyRedirects();
    expect(declared.every((r) => r.status === "301" && r.force === "true")).toBe(true);
    expect(declared.map((r) => [r.rawStatus, r.rawForce])).toEqual(
      declared.map(() => ["301", "true"]),
    );
    expect(Object.fromEntries(declared.map((r) => [r.from, r.to]))).toEqual(PERMANENT_REDIRECTS);
  });

  it("still sets the security headers on a redirect", async () => {
    const { response } = await run("/ediblegardens");
    expect(response.headers.get("x-frame-options")).toBe("SAMEORIGIN");
  });
});
