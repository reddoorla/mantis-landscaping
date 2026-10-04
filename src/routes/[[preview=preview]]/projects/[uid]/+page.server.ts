import { error } from "@sveltejs/kit";

import { loadProject } from "$lib/page-load";
import { createClient, isPlaceholderRepo } from "$lib/prismicio";

export async function load({ params, fetch, cookies }) {
  if (isPlaceholderRepo) error(404, { message: "Page not found" });

  return loadProject(createClient({ fetch, cookies }), params.uid);
}

export async function entries() {
  if (isPlaceholderRepo) return [];

  const projects = await createClient().getAllByType("project");
  return projects.map((project) => ({ uid: project.uid }));
}
