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
      props: {
        slice,
        context: { project: project([photo(1, "Roof garden"), photo(2, "Fireplace")]) },
      },
    });
    const { getByRole } = within(container);
    expect(getByRole("heading", { level: 2, name: "Roof Top Oasis" })).toBeTruthy();
    const strip = getByRole("region", { name: "Roof Top Oasis photos" });
    expect(strip.getAttribute("tabindex")).toBe("0");
  });

  it("keeps an alt attribute on a photo whose alt was left blank", () => {
    const { container } = render(CaseStudies, {
      props: { slice, context: { project: project([photo(1, null), photo(2, "A roof deck")]) } },
    });
    const imgs = [...container.querySelectorAll("img")];
    expect(imgs.map((img) => img.getAttribute("alt"))).toEqual(["", "A roof deck"]);
  });

  it("makes the photo strip a tab stop only when it can scroll", () => {
    const { container } = render(CaseStudies, {
      props: { slice, context: { project: project([photo(1, "Roof garden")]) } },
    });
    expect(container.querySelector('[role="region"]')?.hasAttribute("tabindex")).toBe(false);
  });

  it("renders nothing outside a project", () => {
    const { container } = render(CaseStudies, { props: { slice } });
    expect(container.querySelector("section")).toBeNull();
  });
});

describe("CaseStudies photo strip width", () => {
  it("lets a single photo fill its column, so the strip cannot scroll", () => {
    const { container } = render(CaseStudies, {
      props: { slice, context: { project: project([photo(1, "Roof garden")]) } },
    });
    const strip = container.querySelector('[role="region"]') as HTMLElement;
    expect(strip.className).not.toMatch(/overflow-x-(auto|scroll)/);
    const item = strip.querySelector("li") as HTMLElement;
    expect(item.className.split(/\s+/)).toContain("w-full");
    expect(item.className).not.toMatch(/(^|\s)(md:)?w-\[/);
    expect(item.className).not.toMatch(/(^|\s)shrink-0/);
  });

  it("makes a strip of several photos a named, focusable scroll region", () => {
    const { container } = render(CaseStudies, {
      props: {
        slice,
        context: { project: project([photo(1, "Roof garden"), photo(2, "Fireplace")]) },
      },
    });
    const strip = within(container).getByRole("region", { name: "Roof Top Oasis photos" });
    expect(strip.className).toMatch(/overflow-x-auto/);
    expect(strip.getAttribute("tabindex")).toBe("0");
  });

  it("frames the strip so its focus ring is drawn above the photos", () => {
    const { container } = render(CaseStudies, {
      props: { slice, context: { project: project([photo(1, "a"), photo(2, "b")]) } },
    });
    const strip = container.querySelector(".scroll-strip") as HTMLElement;
    expect(strip.parentElement?.classList.contains("scroll-strip-frame")).toBe(true);
    expect(strip.parentElement?.classList.contains("relative")).toBe(true);
  });
});
