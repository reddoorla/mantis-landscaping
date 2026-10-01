import { render, within } from "@testing-library/svelte";
import { describe, it, expect } from "vitest";
import type { Content } from "@prismicio/client";
import ServiceCards from "./index.svelte";

const slice = {
  slice_type: "service_cards",
  variation: "default",
  primary: {
    heading: [{ type: "heading2", text: "Select a service to learn more below:", spans: [] }],
  },
  items: [
    {
      icon: "water",
      title: "Water Wise Gardens",
      link: { link_type: "Web", url: "/projects/water-wise-gardens" },
    },
    {
      icon: "edible",
      title: "Edible Gardens",
      link: { link_type: "Web", url: "/projects/edible-gardens" },
    },
  ],
} as unknown as Content.ServiceCardsSlice;

describe("ServiceCards slice", () => {
  it("links each card, named by its title", () => {
    const { container } = render(ServiceCards, { props: { slice } });
    const view = within(container);
    expect(view.getByRole("link", { name: "Water Wise Gardens" }).getAttribute("href")).toBe(
      "/projects/water-wise-gardens",
    );
    expect(view.getByRole("link", { name: "Edible Gardens" }).getAttribute("href")).toBe(
      "/projects/edible-gardens",
    );
  });
});
