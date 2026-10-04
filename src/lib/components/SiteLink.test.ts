import { describe, expect, it, afterEach } from "vitest";
import { cleanup, render } from "@testing-library/svelte";
import { createRawSnippet } from "svelte";
import SiteLink from "./SiteLink.svelte";

afterEach(() => cleanup());

const label = createRawSnippet(() => ({ render: () => "<b>Go</b>" }));

const mount = (field: unknown, as?: "span" | "div") =>
  render(SiteLink, { props: { field: field as never, class: "x", as, children: label } });

describe("SiteLink", () => {
  it("carries target and rel for a new-tab web link", () => {
    const { container } = mount({ link_type: "Web", url: "https://example.com", target: "_blank" });
    const a = container.querySelector("a");
    expect(a?.getAttribute("href")).toBe("https://example.com");
    expect(a?.getAttribute("target")).toBe("_blank");
    expect(a?.getAttribute("rel")).toBe("noreferrer");
  });

  it("opens a same-tab web link in the same tab", () => {
    const { container } = mount({ link_type: "Web", url: "https://example.com" });
    expect(container.querySelector("a")?.hasAttribute("target")).toBe(false);
  });

  it("sets neither target nor rel on an internal link", () => {
    const { container } = mount({ link_type: "Document", type: "page", uid: "about", id: "a" });
    const a = container.querySelector("a");
    expect(a?.hasAttribute("target")).toBe(false);
    expect(a?.hasAttribute("rel")).toBe(false);
  });

  it("resolves page and project document links locally", () => {
    const page = mount({ link_type: "Document", type: "page", uid: "about", id: "a" });
    expect(page.container.querySelector("a")?.getAttribute("href")).toBe("/about");
    cleanup();
    const project = mount({
      link_type: "Document",
      type: "project",
      uid: "edible-gardens",
      id: "e",
    });
    expect(project.container.querySelector("a")?.getAttribute("href")).toBe(
      "/projects/edible-gardens",
    );
  });

  it.each([
    ["an empty link", { link_type: "Any" }],
    ["a null field", null],
    [
      "a document of a type with no route",
      { link_type: "Document", type: "form_replies", id: "f" },
    ],
  ])("renders no link for %s", (_, field) => {
    const { container } = mount(field);
    expect(container.querySelector("a")).toBeNull();
    expect(container.querySelector("[href]")).toBeNull();
    const fallback = container.querySelector("span.x");
    expect(fallback?.textContent).toBe("Go");
  });

  it("falls back to a div when the caller wraps block content", () => {
    const { container } = mount({ link_type: "Any" }, "div");
    expect(container.querySelector("div.x")?.textContent).toBe("Go");
  });
});
