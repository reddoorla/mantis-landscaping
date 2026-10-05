function decodedKey(part: string): string {
  const key = part.split("=")[0].replace(/\+/g, " ");
  try {
    return decodeURIComponent(key);
  } catch {
    return key;
  }
}

export function actionHref(search: string, action: string): string {
  const query = search.startsWith("?") ? search.slice(1) : search;
  const kept = query.split("&").filter((part) => part !== "" && !decodedKey(part).startsWith("/"));
  return `?${[...kept, `/${action}`].join("&")}`;
}
