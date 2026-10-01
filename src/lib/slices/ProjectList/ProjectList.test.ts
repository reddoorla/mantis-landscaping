import { render, within } from "@testing-library/svelte";
import { describe, it, expect } from "vitest";
import type { Content } from "@prismicio/client";
import type { ProjectDocument } from "../../../prismicio-types";
import ProjectList from "./index.svelte";

const slice = {
  slice_type: "project_list",
  variation: "default",
  primary: {
    heading: [{ type: "heading2", text: "Select a Project Below to Learn More:", spans: [] }],
  },
  items: [],
} as unknown as Content.ProjectListSlice;

const project = (uid: string, title: string) =>
  ({
    id: uid,
    uid,
    type: "project",
    data: {
      title: [{ type: "heading1", text: title, spans: [] }],
      kicker: "design + installation + maintenance",
      card_image: {
        url: `https://images.prismic.io/x/${uid}.jpg`,
        alt: "x",
        dimensions: { width: 1600, height: 900 },
      },
      hero_image: {},
    },
  }) as unknown as ProjectDocument;

describe("ProjectList slice", () => {
  it("links every project at /projects/<uid>, named by its title", () => {
    const { container } = render(ProjectList, {
      props: {
        slice,
        context: {
          projects: [
            project("water-wise-gardens", "Water Wise Gardens"),
            project("edible-gardens", "Edible Gardens"),
          ],
        },
      },
    });
    const links = within(container).getAllByRole("link");
    expect(links.map((a) => a.getAttribute("href"))).toEqual([
      "/projects/water-wise-gardens",
      "/projects/edible-gardens",
    ]);
    expect(links[0].textContent).toContain("Water Wise Gardens");
    for (const img of container.querySelectorAll("img")) expect(img.getAttribute("alt")).toBe("");
  });

  it("renders nothing without projects", () => {
    const { container } = render(ProjectList, { props: { slice } });
    expect(container.querySelector("section")).toBeNull();
  });
});
