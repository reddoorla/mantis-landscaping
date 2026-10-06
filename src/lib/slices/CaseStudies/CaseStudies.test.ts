import { fireEvent, render, within } from "@testing-library/svelte";
import { SINGLE_PHOTO_SIZES } from "./sizes";
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

  it("titles each study and names its photo carousel for assistive tech", () => {
    const { container } = render(CaseStudies, {
      props: {
        slice,
        context: { project: project([photo(1, "Roof garden"), photo(2, "Fireplace")]) },
      },
    });
    const { getByRole } = within(container);
    expect(getByRole("heading", { level: 2, name: "Roof Top Oasis" })).toBeTruthy();
    const carousel = getByRole("region", { name: "Roof Top Oasis photos" });
    expect(carousel.getAttribute("aria-roledescription")).toBe("carousel");
  });

  it("keeps an alt attribute on a photo whose alt was left blank", () => {
    const { container } = render(CaseStudies, {
      props: { slice, context: { project: project([photo(1, null), photo(2, "A roof deck")]) } },
    });
    const imgs = [...container.querySelectorAll("img")];
    expect(imgs.map((img) => img.getAttribute("alt"))).toEqual(["", "A roof deck"]);
  });

  it("a study with no photos renders no empty photo region", () => {
    const { container } = render(CaseStudies, {
      props: { slice, context: { project: project([]) } },
    });
    expect(container.querySelector("article")).not.toBeNull();
    expect(container.querySelector('[role="region"]')).toBeNull();
    const text = container.querySelector("article > div") as HTMLElement;
    expect(text.className).toContain("md:col-span-5");
  });

  it("renders nothing outside a project", () => {
    const { container } = render(CaseStudies, { props: { slice } });
    expect(container.querySelector("section")).toBeNull();
  });
});

const two = () => project([photo(1, "Roof garden"), photo(2, "Fireplace")]);

describe("CaseStudies photos", () => {
  it("a single photo is a plain image with no carousel controls", () => {
    const { container } = render(CaseStudies, {
      props: { slice, context: { project: project([photo(1, "Roof garden")]) } },
    });
    const view = within(container);
    expect(view.getByRole("region", { name: "Roof Top Oasis photos" })).toBeTruthy();
    expect(container.querySelector('[aria-roledescription="carousel"]')).toBeNull();
    expect(view.queryByRole("button")).toBeNull();
    expect(container.querySelector("img")?.getAttribute("sizes")).toBe(SINGLE_PHOTO_SIZES);
  });

  it("several photos are a fade carousel showing one photo at a time, not a scroll strip", () => {
    const { container } = render(CaseStudies, { props: { slice, context: { project: two() } } });
    const carousel = container.querySelector('[aria-roledescription="carousel"]') as HTMLElement;
    expect(carousel).not.toBeNull();
    expect(container.innerHTML).not.toMatch(/overflow-x-(auto|scroll)|snap-x/);
    const slides = [...carousel.querySelectorAll('[aria-roledescription="slide"]')];
    expect(slides).toHaveLength(2);
    expect(slides.map((el) => el.getAttribute("aria-hidden"))).toEqual([null, "true"]);
    expect(slides[0].className).toContain("duration-500");
    expect(slides[0].className).toContain("transition-opacity");
  });

  it("every carousel photo describes the full column in sizes", () => {
    const { container } = render(CaseStudies, { props: { slice, context: { project: two() } } });
    const imgs = [...container.querySelectorAll("img")];
    expect(imgs).toHaveLength(2);
    for (const img of imgs) expect(img.getAttribute("sizes")).toBe(SINGLE_PHOTO_SIZES);
  });

  it("the arrows and dots change the photo, and nothing autoplays", async () => {
    const { container } = render(CaseStudies, { props: { slice, context: { project: two() } } });
    const view = within(container);
    expect(view.queryByRole("button", { name: /Pause slides/ })).toBeNull();
    const shown = () =>
      [...container.querySelectorAll('[aria-roledescription="slide"]')].findIndex(
        (el) => el.getAttribute("aria-hidden") === null,
      );
    await fireEvent.click(view.getByRole("button", { name: "Next slide" }));
    expect(shown()).toBe(1);
    await fireEvent.click(view.getByRole("button", { name: "Go to slide 1" }));
    expect(shown()).toBe(0);
  });

  it("controls are white on the moss card", () => {
    const { container } = render(CaseStudies, { props: { slice, context: { project: two() } } });
    const view = within(container);
    const next = view.getByRole("button", { name: "Next slide" });
    expect(next.className).toContain("text-white");
    expect(next.classList.contains("bg-black/50")).toBe(true);
    expect(next.parentElement!.querySelector('[aria-roledescription="slide"]')).not.toBeNull();
    expect(view.getByRole("button", { name: "Previous slide" }).parentElement).toBe(
      next.parentElement,
    );
    expect(view.getByRole("button", { name: "Go to slide 2" }).innerHTML).toContain("bg-white/60");
    expect(view.getByRole("button", { name: "Go to slide 1" }).closest(".\\!mt-0")).not.toBeNull();
  });
});
