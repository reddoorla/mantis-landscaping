// The page assemblies in src/lib/site-pages.js are the SINGLE source of truth
// shared by two consumers: the local matching route (src/routes/dev/match/[uid])
// and a Prismic Migration API script, which publishes them (start from the
// starter's scripts/import/migrate.example.ts — no `reddoor-maint` command does
// this; the seed is per-site work).
//
// Those two consumers do NOT validate the same way. The dev route hands the
// object straight to the slice components, so any field a fixture sets is
// simply there. The Migration API validates against the slice models registered
// in Prismic and SILENTLY DROPS every field the model does not declare — no
// error, no warning, a 200. A page can gate green locally and publish wrong.
//
// This test is the mechanical check. It fails the moment a fixture carries a
// field its slice model does not declare — before the seed runs, not after the
// content is published. Run it before every seed.
import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { documents } from "./site-pages.js";

const HERE = dirname(fileURLToPath(import.meta.url));
const SLICES = join(HERE, "slices");

type Field = { type?: string; config?: { fields?: Record<string, Field> } };
type Fields = Record<string, Field>;
type Variation = { primary: Fields; items: Fields };
type Slice = {
  slice_type: string;
  variation: string;
  primary?: Record<string, unknown>;
  items?: Array<Record<string, unknown>>;
};

/** Every slice model in src/lib/slices, indexed by its Prismic slice id. */
function loadModels(): Record<string, Record<string, Variation>> {
  const out: Record<string, Record<string, Variation>> = {};
  if (!existsSync(SLICES)) return out;
  for (const dir of readdirSync(SLICES)) {
    const file = join(SLICES, dir, "model.json");
    if (!existsSync(file)) continue;
    const model = JSON.parse(readFileSync(file, "utf8"));
    out[model.id] = Object.fromEntries(
      (model.variations ?? []).map((v: Record<string, unknown>) => [
        v.id,
        { primary: (v.primary as Fields) ?? {}, items: (v.items as Fields) ?? {} },
      ]),
    );
  }
  return out;
}

/** Every key in `value` the model does not declare, descending into groups. */
function undeclared(path: string, value: Record<string, unknown>, fields: Fields): string[] {
  const out: string[] = [];
  for (const [key, inner] of Object.entries(value)) {
    const field = fields[key];
    if (!field) {
      out.push(`${path}.${key}`);
      continue;
    }
    if (field.type === "Group" && Array.isArray(inner))
      inner.forEach((entry, i) =>
        out.push(...undeclared(`${path}.${key}[${i}]`, entry ?? {}, field.config?.fields ?? {})),
      );
  }
  return out;
}

function strippedFields(
  pages: Array<[string, Slice[]]>,
  models: Record<string, Record<string, Variation>>,
): string[] {
  const stripped: string[] = [];
  for (const [uid, slices] of pages)
    for (const s of slices) {
      const variation = models[s.slice_type]?.[s.variation];
      if (!variation) continue;
      const where = `${uid} ${s.slice_type}/${s.variation}`;
      stripped.push(...undeclared(`${where} primary`, s.primary ?? {}, variation.primary));
      const itemKeys = new Set<string>();
      for (const item of s.items ?? [])
        for (const miss of undeclared(`${where} items`, item, variation.items)) itemKeys.add(miss);
      stripped.push(...itemKeys);
    }
  return stripped;
}

/** Image resolver stub — shape only; this test never reads image values. */
const stubImg = () => ({ url: "https://example.test/x.jpg" });

describe("site-pages documents vs slice models", () => {
  const models = loadModels();
  const docs = documents(stubImg) as Array<{ uid: string; data: { slices?: Slice[] } }>;
  const pages: Array<[string, Slice[]]> = docs.map((d) => [d.uid, d.data.slices ?? []]);

  it("declares every slice type the documents use", () => {
    const missing = new Set<string>();
    for (const [, slices] of pages)
      for (const s of slices) if (!models[s.slice_type]) missing.add(s.slice_type);
    expect([...missing]).toEqual([]);
  });

  it("declares every variation the documents use", () => {
    const missing: string[] = [];
    for (const [uid, slices] of pages)
      for (const s of slices) {
        const model = models[s.slice_type];
        if (model && !model[s.variation]) missing.push(`${uid}: ${s.slice_type}/${s.variation}`);
      }
    expect(missing).toEqual([]);
  });

  // The one that catches a silent Migration-API drop.
  it("declares every field the documents set, so Prismic strips nothing", () => {
    expect(strippedFields(pages, models)).toEqual([]);
  });
});

describe("the strip check itself", () => {
  const models = loadModels();
  const cards = (card: Record<string, unknown>): Array<[string, Slice[]]> => [
    [
      "probe",
      [
        {
          slice_type: "service_cards",
          variation: "default",
          primary: { heading: [], cards: [{ icon: "water", title: "Water", link: {}, ...card }] },
        },
      ],
    ],
  ];

  it("passes a group entry whose every field is declared", () => {
    expect(strippedFields(cards({}), models)).toEqual([]);
  });

  it("reports an undeclared field inside a primary group", () => {
    expect(strippedFields(cards({ subtitle: "x" }), models)).toEqual([
      "probe service_cards/default primary.cards[0].subtitle",
    ]);
  });

  it("reports an undeclared top-level primary field", () => {
    const pages: Array<[string, Slice[]]> = [
      ["probe", [{ slice_type: "service_cards", variation: "default", primary: { kicker: "x" } }]],
    ];
    expect(strippedFields(pages, models)).toEqual(["probe service_cards/default primary.kicker"]);
  });
});
