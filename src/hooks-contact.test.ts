import { describe, expect, it } from "vitest";
import { handle } from "./hooks.server";

const post = async (path: string, method = "POST") => {
  const url = new URL(`https://mantislandscaping.com${path}`);
  let resolved = false;
  const response = await handle({
    event: { url, request: new Request(url, { method }) } as never,
    resolve: async () => {
      resolved = true;
      return new Response("page", { status: 200 });
    },
  });
  return { response, resolved };
};

describe("a POST to /contact-us that names no action", () => {
  it("is redirected with a 307 to the contact action, keeping the query string", async () => {
    const { response, resolved } = await post("/contact-us?utm_source=x");
    expect(resolved).toBe(false);
    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("/contact-us?utm_source=x&/contact");
  });

  it("leaves a named action alone", async () => {
    for (const path of ["/contact-us?/contact", "/contact-us?utm_source=x&/subscribe"]) {
      const { response, resolved } = await post(path);
      expect(resolved).toBe(true);
      expect(response.status).toBe(200);
    }
  });

  it("leaves a GET alone", async () => {
    const { resolved } = await post("/contact-us", "GET");
    expect(resolved).toBe(true);
  });
});
