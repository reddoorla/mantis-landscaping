import { error } from "@sveltejs/kit";
import { NotFoundError, RepositoryNotFoundError } from "@prismicio/client";

import type { PageDocument, ProjectDocument } from "../prismicio-types";
import { pageMeta, projectMeta } from "$lib/page-meta";
import type { SliceContext } from "$lib/slice-context";

/** The minimal client surface the loader needs — method syntax keeps the real
 *  `createClient()` return type assignable, and lets tests pass a stub. */
export type PageClient = {
  getByUID(type: "page", uid: string): Promise<PageDocument>;
  getAllByType(type: "project"): Promise<ProjectDocument[]>;
};

export type ProjectClient = {
  getByUID(type: "project", uid: string): Promise<ProjectDocument>;
};

function isMiss(err: unknown) {
  return err instanceof NotFoundError && !(err instanceof RepositoryNotFoundError);
}

/** Load one `page` document and the layout's head payload for it.
 *
 *  Only a genuine miss (Prismic's NotFoundError: no document with that uid)
 *  becomes a 404. Everything else — an outage, a bad access token, a wrong
 *  repository name, a malformed response — is rethrown so it surfaces as a
 *  5xx at runtime and fails a prerender loudly instead of baking a false
 *  "Page not found" into the build.
 *
 *  (The route loaders answer 404 themselves on the placeholder repo before
 *  calling this, so an unconfigured clone still builds.) */
export async function loadPage(client: PageClient, uid: string) {
  let page: PageDocument;
  try {
    page = await client.getByUID("page", uid);
  } catch (err) {
    if (isMiss(err)) error(404, { message: "Page not found" });
    throw err;
  }
  const listsProjects = page.data.slices.some((slice) => slice.slice_type === "project_list");
  const context: SliceContext = listsProjects
    ? { projects: await client.getAllByType("project") }
    : {};
  return { page, context, ...pageMeta(page) };
}

export async function loadProject(client: ProjectClient, uid: string) {
  let project: ProjectDocument;
  try {
    project = await client.getByUID("project", uid);
  } catch (err) {
    if (isMiss(err)) error(404, { message: "Page not found" });
    throw err;
  }
  const context: SliceContext = { project };
  return { project, context, ...projectMeta(project) };
}
