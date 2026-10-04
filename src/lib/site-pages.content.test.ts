import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join, resolve } from "node:path";
import { ALT, documents } from "./site-pages.js";

const HERE = dirname(fileURLToPath(import.meta.url));
const SLICES = join(HERE, "slices");
const CUSTOM_TYPES = resolve(HERE, "../../customtypes");

type Field = {
  type?: string;
  config?: { single?: string; multi?: string; fields?: Record<string, Field> };
};
type Fields = Record<string, Field>;
type Slice = { slice_type: string; variation: string; primary?: Record<string, unknown> };
type Doc = { type: string; uid: string; data: Record<string, unknown> & { slices?: Slice[] } };
type Block = { type: string };

const SPAN_TYPES = new Set(["strong", "em", "hyperlink", "label"]);

function sliceFields(): Record<string, Record<string, Fields>> {
  const out: Record<string, Record<string, Fields>> = {};
  for (const dir of readdirSync(SLICES)) {
    const file = join(SLICES, dir, "model.json");
    if (!existsSync(file)) continue;
    const model = JSON.parse(readFileSync(file, "utf8"));
    out[model.id] = Object.fromEntries(
      model.variations.map((v: { id: string; primary?: Fields }) => [v.id, v.primary ?? {}]),
    );
  }
  return out;
}

function typeFields(type: string): Fields {
  const model = JSON.parse(readFileSync(join(CUSTOM_TYPES, type, "index.json"), "utf8"));
  return Object.assign({}, ...Object.values(model.json as Record<string, Fields>));
}

function blockTypes(field: Field): Set<string> {
  const declared = (field.config?.single ?? field.config?.multi ?? "").split(",");
  return new Set(declared.map((t) => t.trim()).filter((t) => t && !SPAN_TYPES.has(t)));
}

function richTextViolations(
  path: string,
  value: Record<string, unknown>,
  fields: Fields,
): string[] {
  const out: string[] = [];
  for (const [key, inner] of Object.entries(value)) {
    const field = fields[key];
    if (!field || inner == null) continue;
    if (field.type === "StructuredText" && Array.isArray(inner)) {
      const allowed = blockTypes(field);
      for (const block of inner as Block[])
        if (!allowed.has(block.type)) out.push(`${path}.${key}: ${block.type}`);
    }
    if (field.type === "Group" && Array.isArray(inner))
      inner.forEach((entry, i) =>
        out.push(
          ...richTextViolations(`${path}.${key}[${i}]`, entry ?? {}, field.config?.fields ?? {}),
        ),
      );
  }
  return out;
}

function headingOnes(value: unknown): number {
  if (Array.isArray(value)) return value.reduce((n: number, v) => n + headingOnes(v), 0);
  if (value && typeof value === "object") {
    const block = value as Record<string, unknown>;
    if (block.type === "heading1") return 1;
    return Object.values(block).reduce((n: number, v) => n + headingOnes(v), 0);
  }
  return 0;
}

const photos: Array<{ file: string; alt: string | null }> = [];
const docs = documents((file: string, alt: string | null) => {
  photos.push({ file, alt });
  return { url: `https://example.test/${file}` };
}) as Doc[];

describe("site-pages content vs the models", () => {
  const slices = sliceFields();

  it("every rich-text value uses only the block types its slice model allows", () => {
    const bad: string[] = [];
    for (const doc of docs)
      for (const [i, s] of (doc.data.slices ?? []).entries())
        bad.push(
          ...richTextViolations(
            `${doc.uid} slices[${i}] ${s.slice_type}`,
            s.primary ?? {},
            slices[s.slice_type]?.[s.variation] ?? {},
          ),
        );
    expect(bad).toEqual([]);
  });

  it("every document field is declared, with only the block types its custom type allows", () => {
    const bad: string[] = [];
    for (const doc of docs) {
      const fields = typeFields(doc.type);
      for (const key of Object.keys(doc.data))
        if (!fields[key]) bad.push(`${doc.uid} data.${key}: undeclared`);
      bad.push(...richTextViolations(`${doc.uid} data`, doc.data, fields));
    }
    expect(bad).toEqual([]);
  });

  it("every page document has exactly one h1 among its slices", () => {
    const counts = docs
      .filter((doc) => doc.type === "page")
      .map((doc) => [doc.uid, headingOnes(doc.data.slices ?? [])]);
    expect(counts).toEqual(counts.map(([uid]) => [uid, 1]));
  });

  it("every photo the documents use has alt text", () => {
    expect(photos.length).toBeGreaterThan(0);
    const blank = photos.filter((photo) => !photo.alt?.trim()).map((photo) => photo.file);
    expect(blank).toEqual([]);
  });

  it("keeps no alt text for a photo the documents do not use", () => {
    const used = new Set(photos.map((photo) => photo.file.replace(/\.[a-z]+$/, "")));
    expect(Object.keys(ALT).filter((key) => !used.has(key))).toEqual([]);
  });
});

describe("the rich-text check itself", () => {
  const fields: Fields = {
    heading: { type: "StructuredText", config: { single: "heading2" } },
    cards: {
      type: "Group",
      config: {
        fields: { body: { type: "StructuredText", config: { multi: "paragraph,strong" } } },
      },
    },
  };

  it("passes allowed block types", () => {
    expect(
      richTextViolations(
        "probe",
        {
          heading: [{ type: "heading2" }],
          cards: [{ body: [{ type: "paragraph" }] }],
        },
        fields,
      ),
    ).toEqual([]);
  });

  it("reports a disallowed block type, inside a group too", () => {
    expect(
      richTextViolations(
        "probe",
        {
          heading: [{ type: "heading1" }],
          cards: [{ body: [{ type: "heading3" }] }],
        },
        fields,
      ),
    ).toEqual(["probe.heading: heading1", "probe.cards[0].body: heading3"]);
  });
});
