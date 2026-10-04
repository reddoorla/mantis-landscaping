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

describe("ProjectList scrim", () => {
  const channel = (c: number) => {
    const v = c / 255;
    return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  };
  const luminance = (v: number) => 0.2126 * channel(v) + 0.7152 * channel(v) + 0.0722 * channel(v);

  function weakestBlack(className: string): number {
    const stop = (name: string) => {
      const m = new RegExp(`(?:^|\\s)${name}-black/(\\d+)(?:\\s|$)`).exec(className);
      return m ? Number(m[1]) / 100 : null;
    };
    const flat = stop("bg");
    if (flat !== null) return flat;
    const from = stop("from");
    const via = stop("via");
    const to = stop("to");
    return Math.min(from ?? 0, to ?? 0, ...(via === null ? [] : [via]));
  }

  it("the kicker meets 4.5:1 over a white photo at the scrim's weakest point", () => {
    const { container } = render(ProjectList, {
      props: { slice, context: { projects: [project("edible-gardens", "Edible Gardens")] } },
    });
    const link = container.querySelector("a") as HTMLElement;
    expect(link.className.split(/\s+/)).toContain("text-white");
    const scrim = link.querySelector('span[aria-hidden="true"]') as HTMLElement;
    expect(scrim).not.toBeNull();
    const alpha = weakestBlack(scrim.className);
    const ground = 255 * (1 - alpha);
    const ratio = (1 + 0.05) / (luminance(ground) + 0.05);
    expect(ratio, `white on white photo under ${alpha} black`).toBeGreaterThanOrEqual(4.5);
  });
});
