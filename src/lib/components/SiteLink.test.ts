import { render } from "@testing-library/svelte";
import { createRawSnippet } from "svelte";
import { describe, expect, it } from "vitest";
import SiteLink from "./SiteLink.svelte";

const label = createRawSnippet(() => ({ render: () => "<span>Go</span>" }));

const anchor = (field: unknown) =>
  render(SiteLink, { props: { field: field as never, children: label } }).container.querySelector(
    "a",
  );

describe("SiteLink", () => {
  it("keeps an editor's open-in-new-tab and marks external links noreferrer", () => {
    const a = anchor({ link_type: "Web", url: "https://www.instagram.com/x", target: "_blank" });
    expect(a?.getAttribute("href")).toBe("https://www.instagram.com/x");
    expect(a?.getAttribute("target")).toBe("_blank");
    expect(a?.getAttribute("rel")).toBe("noreferrer");
  });

  it("resolves a document link through the site's link resolver", () => {
    const a = anchor({ link_type: "Document", type: "page", uid: "contact-us", id: "c1" });
    expect(a?.getAttribute("href")).toBe("/contact-us");
    expect(a?.hasAttribute("target")).toBe(false);
  });
});
