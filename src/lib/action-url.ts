export function actionHref(search: string, action: string): string {
  const query = search.startsWith("?") ? search.slice(1) : search;
  const kept = query
    .split("&")
    .filter((part) => part !== "" && !part.startsWith("/") && !part.startsWith("%2F"));
  return `?${[...kept, `/${action}`].join("&")}`;
}
