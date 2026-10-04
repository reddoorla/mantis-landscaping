import { asLinkAttrs, type LinkField } from "@prismicio/client";
import { linkResolver } from "$lib/prismicio";

export function siteHref(field: LinkField | null | undefined): string | null {
  return asLinkAttrs(field, { linkResolver }).href || null;
}
