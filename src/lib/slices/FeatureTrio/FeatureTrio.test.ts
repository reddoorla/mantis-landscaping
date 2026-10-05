import { render, within } from "@testing-library/svelte";
import { describe, it, expect } from "vitest";
import type { Content } from "@prismicio/client";
import FeatureTrio from "./index.svelte";

const slice = (
  items: { icon: string | null; label: string }[],
  heading: unknown[] = [],
  extra: Record<string, unknown> = {},
) =>
  ({
    slice_type: "feature_trio",
    variation: "default",
    primary: { heading, background: "gold-deep", features: items, ...extra },
    items: [],
  }) as unknown as Content.FeatureTrioSlice;

describe("FeatureTrio slice", () => {
  it("renders the pillars as a list, not as headings", () => {
    const { container } = render(FeatureTrio, {
      props: {
        slice: slice([
          { icon: null, label: "Professionally Designed" },
          { icon: null, label: "Gorgeously Grown" },
          { icon: null, label: "Beautifully Maintained" },
        ]),
      },
    });
    const view = within(container);
    expect(view.getAllByRole("listitem").map((li) => li.textContent?.trim())).toEqual([
      "Professionally Designed",
      "Gorgeously Grown",
      "Beautifully Maintained",
    ]);
    expect(view.queryAllByRole("heading")).toHaveLength(0);
  });

  it("draws a decorative Lucide icon for each keyed item", () => {
    const { container } = render(FeatureTrio, {
      props: {
        slice: slice(
          [
            { icon: "design", label: "Thoughtfully Designed" },
            { icon: "community", label: "For the Community" },
          ],
          [{ type: "heading2", text: "Values", spans: [] }],
        ),
      },
    });
    const svgs = container.querySelectorAll("svg");
    expect(svgs).toHaveLength(2);
    for (const svg of svgs) expect(svg.getAttribute("aria-hidden")).toBe("true");
    expect(within(container).getByRole("heading", { level: 2 }).textContent).toBe("Values");
  });
});

describe("FeatureTrio with nothing to show", () => {
  it.each([
    ["no features", []],
    ["only unlabelled features", [{ icon: "water", label: "" }]],
  ])("renders nothing for %s", (_, items) => {
    const { container } = render(FeatureTrio, {
      props: { slice: slice(items, [{ type: "heading2", text: "Our values", spans: [] }]) },
    });
    expect(container.querySelector("section")).toBeNull();
  });

  const pillars = [
    { icon: null, label: "Professionally Designed" },
    { icon: null, label: "Gorgeously Grown" },
    { icon: null, label: "Beautifully Maintained" },
  ];

  it("below the breakpoint the items are a fade carousel; at and above it, the grid", () => {
    const { container } = render(FeatureTrio, {
      props: { slice: slice(pillars, [], { carousel_below: "900", autoplay: null }) },
    });
    const grid = container.querySelector("ul") as HTMLElement;
    expect(grid.className).toContain("max-[899px]:hidden");
    const carousel = container.querySelector("[data-carousel-below]") as HTMLElement;
    expect(carousel.className).toContain("min-[900px]:hidden");
    expect(within(carousel).getByRole("region").getAttribute("aria-roledescription")).toBe(
      "carousel",
    );
    expect(within(carousel).queryByRole("button", { name: /Pause slides/ })).toBeNull();
  });

  it("the pillars switch at 900, the values at 600", () => {
    const values = render(FeatureTrio, {
      props: { slice: slice(pillars, [], { carousel_below: "600", autoplay: 2000 }) },
    });
    expect(values.container.querySelector("ul")!.className).toContain("max-[599px]:hidden");
    expect(values.container.querySelector("[data-carousel-below]")!.className).toContain(
      "min-[600px]:hidden",
    );
  });

  it("the values carousel autoplays (and so offers a pause control)", () => {
    const { container } = render(FeatureTrio, {
      props: { slice: slice(pillars, [], { carousel_below: "600", autoplay: 2000 }) },
    });
    expect(within(container).getByRole("button", { name: "Pause slides" })).toBeTruthy();
  });

  it("with no carousel_below there is only the grid", () => {
    const { container } = render(FeatureTrio, { props: { slice: slice(pillars) } });
    expect(container.querySelector("[data-carousel-below]")).toBeNull();
    expect(container.querySelector("ul")!.className).not.toMatch(/max-\[\d+px\]:hidden/);
  });
});

describe("FeatureTrio model", () => {
  it("carousel_below has no default, so an empty field stays a grid", async () => {
    const model = (await import("./model.json")).default as {
      variations: { primary: Record<string, { type: string; config: Record<string, unknown> }> }[];
    };
    const field = model.variations[0].primary.carousel_below;
    expect(field.type).toBe("Select");
    expect(field.config.options).toEqual(["900", "600"]);
    expect(field.config.default_value).toBeUndefined();
  });
});
