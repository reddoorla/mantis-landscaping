import { render, within } from "@testing-library/svelte";
import { describe, it, expect } from "vitest";
import type { Content } from "@prismicio/client";
import type { ProjectDocument } from "../../../prismicio-types";
import CaseStudies from "./index.svelte";

const slice = {
  slice_type: "case_studies",
  variation: "default",
  primary: { heading: [] },
  items: [],
} as unknown as Content.CaseStudiesSlice;

const photo = (n: number, alt: string | null) => ({
  photo: {
    url: `https://images.prismic.io/mantis-landscaping/${n}.jpg?auto=format`,
    alt,
    copyright: null,
    dimensions: { width: 1600, height: 1200 },
    id: `p${n}`,
    edit: { x: 0, y: 0, zoom: 1, background: "transparent" },
  },
});

const project = (photos: ReturnType<typeof photo>[]) =>
  ({
    uid: "water-wise-gardens",
    type: "project",
    data: {
      case_studies: [
        {
          label: "Residential",
          title: "Roof Top Oasis",
          body: [{ type: "paragraph", text: "Once a hot roof.", spans: [] }],
          photos,
        },
      ],
    },
  }) as unknown as ProjectDocument;

describe("CaseStudies slice", () => {
  it("renders every case-study photo with the alt text written in Prismic", () => {
    const alts = ["Succulents in stucco planters on a roof deck", "A granite outdoor fireplace"];
    const { container } = render(CaseStudies, {
      props: { slice, context: { project: project(alts.map((alt, i) => photo(i, alt))) } },
    });
    const imgs = [...container.querySelectorAll("img")];
    expect(imgs).toHaveLength(2);
    expect(imgs.map((img) => img.getAttribute("alt"))).toEqual(alts);
    for (const img of imgs) expect(img.getAttribute("alt")?.trim()).not.toBe("");
  });

  it("titles each study and labels its photo strip for assistive tech", () => {
    const { container } = render(CaseStudies, {
      props: { slice, context: { project: project([photo(1, "Roof garden")]) } },
    });
    const { getByRole } = within(container);
    expect(getByRole("heading", { level: 2, name: "Roof Top Oasis" })).toBeTruthy();
    const strip = getByRole("region", { name: "Roof Top Oasis photos" });
    expect(strip.getAttribute("tabindex")).toBe("0");
  });

  it("renders nothing outside a project", () => {
    const { container } = render(CaseStudies, { props: { slice } });
    expect(container.querySelector("section")).toBeNull();
  });
});
