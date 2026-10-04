import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { ICON_KEYS, iconFor } from "./icons";

const ROOT = process.cwd();

type Field = { type: string; config?: { options?: string[]; fields?: Record<string, Field> } };

function iconSelects(fields: Record<string, Field> | undefined, out: string[][] = []) {
  for (const [id, field] of Object.entries(fields ?? {})) {
    if (field.type === "Select" && id === "icon") out.push(field.config?.options ?? []);
    if (field.type === "Group") iconSelects(field.config?.fields, out);
  }
  return out;
}

function allIconSelects() {
  const found: string[][] = [];
  const slicesDir = resolve(ROOT, "src/lib/slices");
  for (const dir of readdirSync(slicesDir)) {
    const file = join(slicesDir, dir, "model.json");
    if (!existsSync(file)) continue;
    const model = JSON.parse(readFileSync(file, "utf8"));
    for (const v of model.variations) {
      iconSelects(v.primary, found);
      iconSelects(v.items, found);
    }
  }
  const typesDir = resolve(ROOT, "customtypes");
  for (const dir of readdirSync(typesDir)) {
    const model = JSON.parse(readFileSync(join(typesDir, dir, "index.json"), "utf8"));
    for (const tab of Object.values(model.json) as Record<string, Field>[]) iconSelects(tab, found);
  }
  return found;
}

describe("icons", () => {
  it("every icon Select in the models offers exactly the icons the site can draw", () => {
    const selects = allIconSelects();
    expect(selects.length).toBeGreaterThanOrEqual(4);
    for (const options of selects) expect(options).toEqual(ICON_KEYS);
  });

  it("resolves a known key and refuses anything else", () => {
    expect(iconFor("edible")).toBeTruthy();
    expect(iconFor("toString")).toBeNull();
    expect(iconFor(null)).toBeNull();
  });
});
