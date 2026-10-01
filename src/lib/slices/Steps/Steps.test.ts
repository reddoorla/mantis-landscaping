import { render, within } from "@testing-library/svelte";
import { describe, it, expect } from "vitest";
import type { Content } from "@prismicio/client";
import Steps from "./index.svelte";

const slice = {
  slice_type: "steps",
  variation: "default",
  primary: {
    heading: [{ type: "heading2", text: "How it Works", spans: [] }],
    background: "gold",
    cta_label: "Contact Us",
    cta_link: { link_type: "Web", url: "/contact-us" },
  },
  items: [
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
  ],
} as unknown as Content.StepsSlice;

describe("Steps slice", () => {
  it("renders an ordered list of h3 steps under the h2", () => {
    const { container } = render(Steps, { props: { slice } });
    const view = within(container);
    expect(view.getByRole("heading", { level: 2 }).textContent).toBe("How it Works");
    expect(view.getAllByRole("heading", { level: 3 }).map((h) => h.textContent)).toEqual([
      "Garden Visit",
      "Custom Plan",
    ]);
    expect(container.querySelector("ol")?.children).toHaveLength(2);
  });

  it("shows the photo when there is one and the icon otherwise", () => {
    const { container } = render(Steps, { props: { slice } });
    expect(container.querySelector("img")?.getAttribute("alt")).toBe("Compost held in two hands");
    expect(container.querySelectorAll("svg")).toHaveLength(1);
  });
});
