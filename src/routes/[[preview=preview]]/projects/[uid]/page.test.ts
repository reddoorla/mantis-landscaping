import { render, within } from "@testing-library/svelte";
import { describe, expect, it } from "vitest";
import Page from "./+page.svelte";

const image = (name: string, alt: string) => ({
  url: `https://images.prismic.io/mantis-landscaping/${name}.jpg?auto=format`,
  alt,
  copyright: null,
  dimensions: { width: 1600, height: 1200 },
  id: name,
  edit: { x: 0, y: 0, zoom: 1, background: "transparent" },
});

const project = {
  id: "w1",
  uid: "water-wise-gardens",
  type: "project",
  data: {
    title: [{ type: "heading1", text: "Water Wise Gardens", spans: [] }],
    kicker: "design + installation + maintenance",
    intro: [{ type: "paragraph", text: "Drought tolerant landscapes.", spans: [] }],
    hero_image: image("poppies", "Orange California poppies"),
    services_heading: "Services provided",
    services: [{ icon: "native", label: "Native Gardens" }],
    case_studies: [
      {
        label: "Residential",
        title: "Roof Top Oasis",
        body: [],
        photos: [{ photo: image("roof", "A white rooftop terrace") }],
      },
    ],
    slices: [
      {
        id: "cs",
        slice_type: "case_studies",
        variation: "default",
        primary: { heading: [] },
        items: [],
      },
    ],
  },
};

describe("/projects/[uid] page", () => {
  it("renders the hero, the services and the case studies the loader hands it", () => {
    const { container } = render(Page, {
      props: { data: { project, context: { project } } as never },
    });
    const view = within(container);
    expect(view.getByRole("heading", { level: 1 }).textContent).toContain("Water Wise Gardens");
    expect(view.getByText("Native Gardens")).toBeTruthy();
    expect(view.getByRole("heading", { name: "Roof Top Oasis" })).toBeTruthy();
    expect(view.getByAltText("A white rooftop terrace")).toBeTruthy();
  });

  it("skips the services row when no service has a label", () => {
    const empty = {
      ...project,
      data: { ...project.data, services: [{ icon: null, label: null }] },
    };
    const { container } = render(Page, {
      props: { data: { project: empty, context: { project: empty } } as never },
    });
    expect(within(container).queryByText("Services provided")).toBeNull();
  });
});
