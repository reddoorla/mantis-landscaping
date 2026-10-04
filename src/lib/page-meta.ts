import { asText } from "@prismicio/client";

import type { PageDocument, ProjectDocument } from "../prismicio-types";

/** The layout's SEO/head payload for a page document (see <Seo> in
 *  +layout.svelte). Shared by both `[[preview]]` loaders so the two stay
 *  identical.
 *  The optional chaining on meta_image is deliberate — Prismic's empty-image
 *  shape has changed across API versions, so an unfilled image never throws. */
export function pageMeta(page: PageDocument | ProjectDocument) {
  return {
    title: asText(page.data.title),
    meta_description: page.data.meta_description,
    meta_title: page.data.meta_title,
    meta_image: page.data.meta_image?.url,
    meta_image_alt: page.data.meta_image?.alt ?? undefined,
  };
}

const DESCRIPTION_LENGTH = 155;

function summarise(text: string) {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= DESCRIPTION_LENGTH) return clean;
  const cut = clean.slice(0, DESCRIPTION_LENGTH - 1);
  return `${cut.slice(0, cut.lastIndexOf(" ")).replace(/[,;:.!?]$/, "")}…`;
}

export function projectMeta(project: ProjectDocument) {
  const meta = pageMeta(project);
  return {
    ...meta,
    meta_description: meta.meta_description || summarise(asText(project.data.intro)) || null,
    meta_image: meta.meta_image ?? project.data.hero_image?.url ?? undefined,
    meta_image_alt: meta.meta_image
      ? meta.meta_image_alt
      : (project.data.hero_image?.alt ?? undefined),
  };
}
