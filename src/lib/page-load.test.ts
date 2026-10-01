import { describe, expect, it } from "vitest";
import { NotFoundError, RepositoryNotFoundError } from "@prismicio/client";

import { loadPage, loadProject, type PageClient, type ProjectClient } from "./page-load";

const doc = {
  uid: "about",
  type: "page",
  data: { title: [{ type: "heading1", text: "About", spans: [] }], slices: [] },
} as never;

const clientThat = (behaviour: () => Promise<never> | Promise<typeof doc>) =>
  ({ getByUID: behaviour, getAllByType: async () => [] }) as unknown as PageClient;

describe("loadPage", () => {
  it("returns the document plus its head payload", async () => {
    const client = clientThat(async () => doc);
    await expect(loadPage(client, "about")).resolves.toMatchObject({
      page: doc,
      title: "About",
    });
  });

  it("turns a Prismic miss into a 404", async () => {
    const client = clientThat(async () => {
      throw new NotFoundError("No documents were returned", "https://x", undefined);
    });
    await expect(loadPage(client, "missing")).rejects.toMatchObject({
      status: 404,
    });
  });

  it("rethrows anything that is not a miss so outages stay loud", async () => {
    const boom = new Error("ECONNRESET");
    const client = clientThat(async () => {
      throw boom;
    });
    await expect(loadPage(client, "about")).rejects.toBe(boom);
  });

  it("rethrows a wrong repository name instead of calling it a 404", async () => {
    const wrongRepo = new RepositoryNotFoundError("Repository not found", "https://x", undefined);
    const client = clientThat(async () => {
      throw wrongRepo;
    });
    await expect(loadPage(client, "about")).rejects.toBe(wrongRepo);
  });

  it("loads the projects only for a page that lists them", async () => {
    const projects = [{ uid: "edible-gardens" }];
    const calls: string[] = [];
    const client = {
      getByUID: async () => ({
        uid: "projects",
        type: "page",
        data: { title: [], slices: [{ slice_type: "project_list" }] },
      }),
      getAllByType: async (type: string) => {
        calls.push(type);
        return projects;
      },
    } as unknown as PageClient;
    const data = await loadPage(client, "projects");
    expect(calls).toEqual(["project"]);
    expect(data.context.projects).toBe(projects);

    calls.length = 0;
    const plain = await loadPage(
      clientThat(async () => doc),
      "about",
    );
    expect(plain.context).toEqual({});
  });
});

describe("loadProject", () => {
  it("asks for a project, and turns a miss into a 404", async () => {
    const asked: string[] = [];
    const client = {
      getByUID: async (type: string) => {
        asked.push(type);
        throw new NotFoundError("No documents were returned", "https://x", undefined);
      },
    } as unknown as ProjectClient;
    await expect(loadProject(client, "nope")).rejects.toMatchObject({ status: 404 });
    expect(asked).toEqual(["project"]);
  });
});
