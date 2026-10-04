import { describe, expect, it, vi } from "vitest";

const prismic = vi.hoisted(() => ({
  getAllByType: vi.fn(async () => [{ uid: "home" }, { uid: "projects" }, { uid: "contact-us" }]),
}));

vi.mock("$lib/prismicio", () => ({
  isPlaceholderRepo: false,
  createClient: () => ({ getAllByType: prismic.getAllByType }),
}));

const { entries } = await import("./+page.server");

describe("[uid] prerender entries", () => {
  it("leaves out home, which renders at /, and contact-us, which has its own form route", async () => {
    await expect(entries()).resolves.toEqual([{ uid: "projects" }]);
  });
});
