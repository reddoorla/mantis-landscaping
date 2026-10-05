export function pageUrl(url: URL): string {
  const clean = new URL(url);
  for (const key of [...clean.searchParams.keys()]) {
    if (key.startsWith("/")) clean.searchParams.delete(key);
  }
  return clean.href;
}
