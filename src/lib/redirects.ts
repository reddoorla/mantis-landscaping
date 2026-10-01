export const PERMANENT_REDIRECTS: Readonly<Record<string, string>> = {
  "/ediblegardens": "/projects/edible-gardens",
  "/projects/ediblegardens": "/projects/edible-gardens",
};

export function redirectFor(pathname: string): string | null {
  const path = pathname.length > 1 ? pathname.replace(/\/+$/, "") : pathname;
  return Object.hasOwn(PERMANENT_REDIRECTS, path) ? PERMANENT_REDIRECTS[path] : null;
}
