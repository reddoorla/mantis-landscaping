import { beforeEach, describe, expect, it, vi } from "vitest";

const prismic = vi.hoisted(() => ({
  getByUID: vi.fn(),
  getAllByType: vi.fn(),
}));

vi.mock("$lib/prismicio", () => ({
  isPlaceholderRepo: false,
  createClient: () => ({ getByUID: prismic.getByUID, getAllByType: prismic.getAllByType }),
}));

const { load, entries } = await import("./+page.server");

const edible = {
  id: "e1",
  uid: "edible-gardens",
  type: "project",
  data: {
    title: [{ type: "heading1", text: "Edible Gardens", spans: [] }],
    hero_image: { url: "https://images.prismic.io/x/hero.jpg", alt: "Raised beds" },
    meta_title: null,
    meta_description: "Edible gardens in Los Angeles.",
    meta_image: {},
    case_studies: [],
    services: [],
    slices: [],
  },
};

describe("/projects/[uid]", () => {
  beforeEach(() => {
    prismic.getByUID.mockReset();
    prismic.getAllByType.mockReset();
  });

  it("resolves /projects/edible-gardens to the project document of that uid", async () => {
    prismic.getByUID.mockImplementation(async (type: string, uid: string) => {
      if (type === "project" && uid === "edible-gardens") return edible;
      throw new Error(`unexpected ${type}:${uid}`);
    });
    const data = await load({ params: { uid: "edible-gardens" }, fetch, cookies: {} } as never);
    expect(prismic.getByUID).toHaveBeenCalledWith("project", "edible-gardens");
    expect(data.project.type).toBe("project");
    expect(data.context.project).toBe(data.project);
    expect(data.title).toBe("Edible Gardens");
    expect(data.meta_image).toBe("https://images.prismic.io/x/hero.jpg");
  });

  it("prerenders one entry per project document", async () => {
    prismic.getAllByType.mockResolvedValue([edible, { ...edible, uid: "water-wise-gardens" }]);
    await expect(entries()).resolves.toEqual([
      { uid: "edible-gardens" },
      { uid: "water-wise-gardens" },
    ]);
    expect(prismic.getAllByType).toHaveBeenCalledWith("project");
  });
});
