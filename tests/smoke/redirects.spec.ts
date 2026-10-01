import { test, expect } from "@playwright/test";

for (const path of ["/ediblegardens", "/projects/ediblegardens"]) {
  test(`${path} answers 301 to the kept edible-gardens page`, async ({ request }) => {
    const response = await request.get(path, { maxRedirects: 0 });
    expect(response.status()).toBe(301);
    expect(response.headers()["location"]).toBe("/projects/edible-gardens");
  });
}
