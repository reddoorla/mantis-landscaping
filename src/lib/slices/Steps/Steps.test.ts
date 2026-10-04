import { render, within } from "@testing-library/svelte";
import { describe, it, expect } from "vitest";
import type { Content } from "@prismicio/client";
import Steps from "./index.svelte";

const steps = [
  {
    image: {
      url: "https://images.prismic.io/x/soil.jpg",
      alt: "Compost held in two hands",
      dimensions: { width: 1200, height: 1200 },
    },
    icon: "visit",
    title: "Garden Visit",
    body: [{ type: "paragraph", text: "Schedule a quick garden visit.", spans: [] }],
  },
  { image: {}, icon: "plan", title: "Custom Plan", body: [] },
];

const slice = (heading: unknown[], background = "gold-deep") =>
  ({
    slice_type: "steps",
    variation: "default",
    primary: {
      heading,
      background,
      cta_label: "Contact Us",
      cta_link: { link_type: "Web", url: "/contact-us" },
      steps,
    },
    items: [],
  }) as unknown as Content.StepsSlice;

const howItWorks = [{ type: "heading2", text: "How it Works", spans: [] }];

describe("Steps slice", () => {
  it("renders an ordered list of h3 steps under the h2", () => {
    const { container } = render(Steps, { props: { slice: slice(howItWorks) } });
    const view = within(container);
    expect(view.getByRole("heading", { level: 2 }).textContent).toBe("How it Works");
    expect(view.getAllByRole("heading", { level: 3 }).map((h) => h.textContent)).toEqual([
      "Garden Visit",
      "Custom Plan",
    ]);
    expect(container.querySelector("ol")?.children).toHaveLength(2);
  });

  it("promotes the step titles to h2 when the band has no heading", () => {
    const { container } = render(Steps, { props: { slice: slice([]) } });
    expect(within(container).getAllByRole("heading", { level: 2 })).toHaveLength(2);
  });

  it("shows the photo when there is one and the icon otherwise", () => {
    const { container } = render(Steps, { props: { slice: slice(howItWorks) } });
    expect(container.querySelector("img")?.getAttribute("alt")).toBe("Compost held in two hands");
    expect(container.querySelectorAll("svg")).toHaveLength(1);
  });

  it("keeps the bright Blux gold only under dark type", () => {
    const { container } = render(Steps, { props: { slice: slice(howItWorks, "gold") } });
    const section = container.querySelector("section");
    expect(section?.className).toContain("bg-gold");
    expect(section?.className).toContain("text-primary");
    expect(section?.className).not.toContain("text-white");
  });
});

describe("Steps with nothing to show", () => {
  it.each([
    ["no steps", []],
    ["only untitled steps", [{ image: {}, icon: "plan", title: null, body: [] }]],
  ])("renders nothing for %s", (_, group) => {
    const empty = slice([{ type: "heading2", text: "How it works", spans: [] }]) as unknown as {
      primary: Record<string, unknown>;
    };
    const { container } = render(Steps, {
      props: { slice: { ...empty, primary: { ...empty.primary, steps: group } } as never },
    });
    expect(container.querySelector("section")).toBeNull();
  });
});
