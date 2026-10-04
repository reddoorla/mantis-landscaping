import { render, within } from "@testing-library/svelte";
import { describe, it, expect } from "vitest";
import type { Content } from "@prismicio/client";
import FeatureTrio from "./index.svelte";

const slice = (items: { icon: string | null; label: string }[], heading: unknown[] = []) =>
  ({
    slice_type: "feature_trio",
    variation: "default",
    primary: { heading, background: "gold-deep", features: items },
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
