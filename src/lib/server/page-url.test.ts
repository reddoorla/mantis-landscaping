import { describe, expect, it } from "vitest";
import { pageUrl } from "./page-url";

describe("pageUrl", () => {
  it("drops the named-action key and keeps the visitor's query string", () => {
    expect(pageUrl(new URL("https://example.com/contact-us?utm_source=x&/contact"))).toBe(
      "https://example.com/contact-us?utm_source=x",
    );
  });

  it("leaves a URL with no action key alone", () => {
    expect(pageUrl(new URL("https://example.com/contact-us?utm_source=x"))).toBe(
      "https://example.com/contact-us?utm_source=x",
    );
  });
});
