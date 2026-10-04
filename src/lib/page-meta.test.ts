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

const projectDoc = (data: Record<string, unknown>) =>
  ({
    uid: "edible-gardens",
    type: "project",
    data: {
      title: [{ type: "heading1", text: "Edible Gardens", spans: [] }],
      meta_title: null,
      meta_description: null,
      meta_image: {},
      intro: [{ type: "paragraph", text: "Raised beds and fruit trees.", spans: [] }],
      hero_image: { url: "https://images.prismic.io/x/hero.jpg", alt: "Raised beds" },
      ...data,
    },
  }) as unknown as ProjectDocument;

describe("projectMeta fallbacks", () => {
  it("falls back to the intro for the description and the hero for the image and its alt", () => {
    expect(projectMeta(projectDoc({}))).toMatchObject({
      meta_description: "Raised beds and fruit trees.",
      meta_image: "https://images.prismic.io/x/hero.jpg",
      meta_image_alt: "Raised beds",
    });
  });

  it("prefers the SEO tab when it is filled, keeping that image's own alt", () => {
    const meta = projectMeta(
      projectDoc({
        meta_description: "Edible gardens in Los Angeles.",
        meta_image: { url: "https://images.prismic.io/x/og.jpg", alt: null },
      }),
    );
    expect(meta).toMatchObject({
      meta_description: "Edible gardens in Los Angeles.",
      meta_image: "https://images.prismic.io/x/og.jpg",
      meta_image_alt: undefined,
    });
  });

  it("cuts a long intro at a word boundary, under 155 characters, with an ellipsis", () => {
    const long = Array.from({ length: 40 }, (_, i) => `word${i}`).join(" ");
    const meta = projectMeta(projectDoc({ intro: [{ type: "paragraph", text: long, spans: [] }] }));
    const description = meta.meta_description as string;
    expect(description.length).toBeLessThanOrEqual(155);
    expect(description.endsWith("…")).toBe(true);
    expect(long.startsWith(description.slice(0, -1))).toBe(true);
    expect(long[description.length - 1]).toBe(" ");
  });

  it("gives no description when neither the SEO tab nor the intro has one", () => {
    expect(projectMeta(projectDoc({ intro: [] })).meta_description).toBeNull();
  });
});

describe("projectMeta on an intro with no spaces", () => {
  it("cuts at the length limit instead of to a single character", () => {
    const long = "x".repeat(400);
    const description = projectMeta(
      projectDoc({ intro: [{ type: "paragraph", text: long, spans: [] }] }),
    ).meta_description as string;
    expect(description).toBe(`${"x".repeat(154)}…`);
  });
});
