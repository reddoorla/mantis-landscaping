import { describe, expect, it } from "vitest";
import { actionHref } from "./action-url";

describe("actionHref", () => {
  it("names the action on an empty query", () => {
    expect(actionHref("", "contact")).toBe("?/contact");
  });

  it("keeps the page's own query string", () => {
    expect(actionHref("?utm_source=x&utm_campaign=y", "subscribe")).toBe(
      "?utm_source=x&utm_campaign=y&/subscribe",
    );
  });

  it("replaces an action key already in the query", () => {
    expect(actionHref("?utm_source=x&/contact", "subscribe")).toBe("?utm_source=x&/subscribe");
    expect(actionHref("?%2Fcontact=&a=1", "contact")).toBe("?a=1&/contact");
  });
});
