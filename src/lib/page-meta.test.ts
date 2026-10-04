import { describe, expect, it } from "vitest";

import { pageMeta, projectMeta } from "./page-meta";
import type { PageDocument, ProjectDocument } from "../prismicio-types";

// The five keys here are exactly what +layout.svelte's <Seo> reads from
// page.data (title / meta_title / meta_description / meta_image /
// meta_image_alt). Rename one and this test, not a silent blank <title>, fails.
//
// Left untyped (not `as PageDocument`) so it stays a plain object — that's
// what lets the spread below build a variant of it; each call site below
// casts to PageDocument only where pageMeta requires it.
const page = {
  uid: "team",
  type: "page",
  data: {
    title: [{ type: "heading1", text: "Our Team", spans: [] }],
    meta_title: "Our Team | Clinic",
    meta_description: "Meet the team.",
    meta_image: { url: "https://images.prismic.io/og.png", alt: "Team photo" },
    slices: [],
  },
};

describe("pageMeta", () => {
  it("maps a page document onto the layout's <Seo> payload", () => {
    expect(pageMeta(page as unknown as PageDocument)).toEqual({
      title: "Our Team",
      meta_title: "Our Team | Clinic",
      meta_description: "Meet the team.",
      meta_image: "https://images.prismic.io/og.png",
      meta_image_alt: "Team photo",
    });
  });

  it("is undefined-safe when the SEO tab is empty", () => {
    const bare = { ...page, data: { ...page.data, meta_image: undefined } };
    expect(pageMeta(bare as unknown as PageDocument)).toMatchObject({
      title: "Our Team",
      meta_image: undefined,
      meta_image_alt: undefined,
    });
  });
});

const project = (data: Record<string, unknown>) =>
  ({
    uid: "water-wise-gardens",
    type: "project",
    data: {
      title: [{ type: "heading1", text: "Water Wise Gardens", spans: [] }],
      meta_title: null,
      meta_description: null,
      meta_image: {},
      intro: [],
      hero_image: { url: "https://images.prismic.io/x/hero.jpg", alt: "Orange poppies" },
      ...data,
    },
  }) as unknown as ProjectDocument;

describe("projectMeta", () => {
  it("falls back to the intro for the description and the hero for the share image", () => {
    const meta = projectMeta(
      project({
        intro: [{ type: "paragraph", text: "Drought tolerant landscapes.", spans: [] }],
      }),
    );
    expect(meta.meta_description).toBe("Drought tolerant landscapes.");
    expect(meta.meta_image).toBe("https://images.prismic.io/x/hero.jpg");
    expect(meta.meta_image_alt).toBe("Orange poppies");
  });

  it("keeps what the editor wrote over any fallback", () => {
    const meta = projectMeta(
      project({
        meta_description: "Written by the editor.",
        meta_image: { url: "https://images.prismic.io/x/og.jpg", alt: "Share card" },
        intro: [{ type: "paragraph", text: "Intro.", spans: [] }],
      }),
    );
    expect(meta.meta_description).toBe("Written by the editor.");
    expect(meta.meta_image).toBe("https://images.prismic.io/x/og.jpg");
    expect(meta.meta_image_alt).toBe("Share card");
  });

  it("cuts a long intro at a word, under 155 characters, with an ellipsis", () => {
    const words = "Edible gardens don't have to look like a farm! ".repeat(6);
    const meta = projectMeta(project({ intro: [{ type: "paragraph", text: words, spans: [] }] }));
    const description = meta.meta_description ?? "";
    expect(description.length).toBeLessThanOrEqual(155);
    expect(description.endsWith("…")).toBe(true);
    expect(words.startsWith(description.slice(0, -1))).toBe(true);
    expect(description.slice(0, -1).endsWith(" ")).toBe(false);
  });

  it("still cuts text with no spaces at all", () => {
    const meta = projectMeta(
      project({ intro: [{ type: "paragraph", text: "x".repeat(400), spans: [] }] }),
    );
    expect(meta.meta_description).toBe(`${"x".repeat(154)}…`);
  });
});
