// The wait every @smoke spec that reads the page starts with. The root layout
// sets `html[data-hydrated]` in onMount, after the whole client tree has
// mounted. On CI's `vite dev` gate server `load` fires about 2s BEFORE
// hydration, so a spec that measures, scans or interacts on a server-rendered
// element is measuring markup that onMount code has not touched yet: a page
// made 1100px wide in an onMount passes an overflow check, and a button added
// after mount passes axe. A cold dev server can need 30s to get there, so a
// spec that uses this sets a test limit above it (HYDRATION_TEST_TIMEOUT_MS).
import type { Page } from "@playwright/test";

export const HYDRATION_WAIT_MS = 30_000;
export const HYDRATION_TEST_TIMEOUT_MS = 60_000;

export async function hydrated(page: Page) {
  await page
    .locator("html[data-hydrated]")
    .waitFor({ state: "attached", timeout: HYDRATION_WAIT_MS });
}
