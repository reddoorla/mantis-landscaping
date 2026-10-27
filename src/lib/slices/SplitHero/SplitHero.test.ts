import { render, within } from "@testing-library/svelte";
import { describe, it, expect } from "vitest";
import type { Content } from "@prismicio/client";
import SplitHero from "./index.svelte";
import { contrast, textAndGround } from "../../../test-utils/theme-colors";

const slice = (tone: string) =>
  ({
    slice_type: "split_hero",
    variation: "default",
    primary: {
      image: {
        url: "https://images.prismic.io/mantis-landscaping/chard.jpg?auto=format",
        alt: "A hand holding a rainbow chard seedling",
        dimensions: { width: 1600, height: 2000 },
      },
      kicker: null,
      heading: [
        {
          type: "heading1",
          text: "Creating green spaces that bring beauty and substance into your life.",
          spans: [],
        },
      ],
      body: [],
      cta_label: "Contact Us",
      cta_link: { link_type: "Web", url: "/contact-us" },
      tone,
    },
    items: [],
  }) as unknown as Content.SplitHeroSlice;

describe("SplitHero slice", () => {
  it("renders the h1, the photo with its alt, and the call to action", () => {
    const { container } = render(SplitHero, { props: { slice: slice("dark") } });
    const view = within(container);
    expect(view.getByRole("heading", { level: 1 }).textContent).toContain("green spaces");
    expect(view.getByRole("img").getAttribute("alt")).toBe(
      "A hand holding a rainbow chard seedling",
    );
    expect(view.getByRole("link", { name: "Contact Us +" }).getAttribute("href")).toBe(
      "/contact-us",
    );
  });

  it("puts white type on the darkened gold, never the Blux gold", () => {
    const { container } = render(SplitHero, { props: { slice: slice("gold-deep") } });
    const { text, ground } = textAndGround(container.querySelector("h1")!);
    expect(text, "the heading's text-* token").not.toBeNull();
    expect(ground, "the panel's bg-* token").not.toBeNull();
    expect(contrast(text!, ground!), `${text} on ${ground}`).toBeGreaterThanOrEqual(4.5);
    expect(container.querySelector(".bg-gold")).toBeNull();
  });

  it("honours the editor's tone: gold-deep and dark paint different panels", () => {
    // Distinctness, no colour pinned: a CMS choice that renders the same as the
    // default silently does nothing.
    const groundOf = (tone: string) => {
      const { container, unmount } = render(SplitHero, { props: { slice: slice(tone) } });
      const { ground } = textAndGround(container.querySelector("h1")!);
      unmount();
      return ground;
    };
    const dark = groundOf("dark");
    expect(dark, "the dark panel's bg-* token").not.toBeNull();
    expect(groundOf("gold-deep")).not.toBe(dark);
  });
});
