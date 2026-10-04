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
  config?: {
    single?: string;
    multi?: string;
    options?: string[];
    default_value?: string;
    fields?: Record<string, Field>;
    choices?: Record<string, unknown>;
  };
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

const LINK_TYPES = new Set(["Any", "Web", "Document", "Media"]);

function fieldViolation(field: Field, value: unknown): string | null {
  if (value === null)
    return field.type === "Select" && field.config?.default_value !== undefined
      ? `null becomes the Select's default ${JSON.stringify(field.config.default_value)}`
      : null;
  switch (field.type) {
    case "StructuredText": {
      if (!Array.isArray(value)) return "not a rich-text array";
      const allowed = blockTypes(field);
      const bad = (value as Block[]).map((b) => b.type).filter((t) => !allowed.has(t));
      return bad.length ? bad.join(", ") : null;
    }
    case "Select":
      return field.config?.options?.includes(value as string)
        ? null
        : `${JSON.stringify(value)} is not an option`;
    case "Number":
      return typeof value === "number" ? null : `${JSON.stringify(value)} is not a number`;
    case "Text":
      return typeof value === "string" ? null : `${JSON.stringify(value)} is not text`;
    case "Boolean":
      return typeof value === "boolean" ? null : `${JSON.stringify(value)} is not a boolean`;
    case "Link":
      return typeof value === "function" ||
        (typeof value === "object" &&
          LINK_TYPES.has((value as { link_type?: string }).link_type ?? ""))
        ? null
        : `${JSON.stringify(value)} is not a link`;
    case "Image":
      return typeof value === "object" && !Array.isArray(value) ? null : "not an image";
    case "Group":
      return Array.isArray(value) ? null : "not a group";
    case "Slices":
      return Array.isArray(value) ? null : "not a slice zone";
    default:
      return `unchecked field type ${field.type}`;
  }
}

function valueViolations(path: string, value: Record<string, unknown>, fields: Fields): string[] {
  const out: string[] = [];
  for (const [key, inner] of Object.entries(value)) {
    const field = fields[key];
    if (!field) {
      out.push(`${path}.${key}: undeclared`);
      continue;
    }
    const problem = fieldViolation(field, inner);
    if (problem) out.push(`${path}.${key}: ${problem}`);
    if (field.type === "Group" && Array.isArray(inner))
      inner.forEach((entry, i) =>
        out.push(
          ...valueViolations(`${path}.${key}[${i}]`, entry ?? {}, field.config?.fields ?? {}),
        ),
      );
    if (field.type === "Slices" && Array.isArray(inner))
      for (const [i, s] of (inner as Slice[]).entries())
        if (!field.config?.choices?.[s.slice_type])
          out.push(`${path}.${key}[${i}]: ${s.slice_type} is not a choice here`);
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

  it("every slice value fits its slice model: fields, block types, options, links", () => {
    const bad: string[] = [];
    for (const doc of docs)
      for (const [i, s] of (doc.data.slices ?? []).entries())
        bad.push(
          ...valueViolations(
            `${doc.uid} slices[${i}] ${s.slice_type}`,
            s.primary ?? {},
            slices[s.slice_type]?.[s.variation] ?? {},
          ),
        );
    expect(bad).toEqual([]);
  });

  it("every document value fits its custom type, groups and slice choices included", () => {
    const bad: string[] = [];
    for (const doc of docs)
      bad.push(...valueViolations(`${doc.uid} data`, doc.data, typeFields(doc.type)));
    expect(bad).toEqual([]);
  });

  it("no project carries an h1 in its slices: the project route renders its title as the h1", () => {
    const counts = docs
      .filter((doc) => doc.type === "project")
      .map((doc) => [doc.uid, headingOnes(doc.data.slices ?? [])]);
    expect(counts).toEqual(counts.map(([uid]) => [uid, 0]));
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

describe("the value check itself", () => {
  const fields: Fields = {
    heading: { type: "StructuredText", config: { single: "heading2" } },
    background: { type: "Select", config: { options: ["dark", "light"] } },
    tone: { type: "Select", config: { options: ["dark"], default_value: "dark" } },
    order: { type: "Number" },
    cta_link: { type: "Link" },
    slices: { type: "Slices", config: { choices: { steps: {} } } },
    cards: {
      type: "Group",
      config: {
        fields: { body: { type: "StructuredText", config: { multi: "paragraph,strong" } } },
      },
    },
  };
  const good = {
    heading: [{ type: "heading2" }],
    background: "dark",
    order: 1,
    cta_link: { link_type: "Web", url: "/x" },
    slices: [{ slice_type: "steps", variation: "default" }],
    cards: [{ body: [{ type: "paragraph" }] }],
  };

  it("passes values that fit", () => {
    expect(valueViolations("probe", good, fields)).toEqual([]);
    expect(valueViolations("probe", { ...good, cta_link: () => ({}) }, fields)).toEqual([]);
  });

  it.each([
    ["a disallowed block type", { heading: [{ type: "heading1" }] }, "probe.heading: heading1"],
    ["a Select value that is not an option", { background: "golden" }, "probe.background:"],
    ["a null Select that has a default", { tone: null }, "probe.tone: null becomes"],
    ["a string in a Number field", { order: "1" }, "probe.order:"],
    ["a string in a Link field", { cta_link: "/contact-us" }, "probe.cta_link:"],
    ["a slice that is not a choice", { slices: [{ slice_type: "hero" }] }, "probe.slices[0]:"],
    ["an undeclared field in a group", { cards: [{ subtitle: "x" }] }, "probe.cards[0].subtitle:"],
    [
      "a disallowed block in a group",
      { cards: [{ body: [{ type: "heading3" }] }] },
      "probe.cards[0].body:",
    ],
  ])("reports %s", (_, change, expected) => {
    const bad = valueViolations("probe", { ...good, ...change }, fields);
    expect(bad).toHaveLength(1);
    expect(bad[0].startsWith(expected)).toBe(true);
  });
});

describe("the value check's own edges", () => {
  it("reports a field type it does not know how to check, instead of passing it", () => {
    expect(valueViolations("probe", { swatch: "#fff" }, { swatch: { type: "Color" } })).toEqual([
      "probe.swatch: unchecked field type Color",
    ]);
  });
});

describe("the documents' links", () => {
  it("point only at documents the seed creates", () => {
    const targets: string[] = [];
    const built = documents(
      () => ({}),
      (target: string) => {
        targets.push(target);
        return { link_type: "Any" };
      },
    ) as Doc[];
    const created = new Set(built.map((doc) => `${doc.type}:${doc.uid}`));
    expect(targets.length).toBeGreaterThan(0);
    expect(targets.filter((target) => !created.has(target))).toEqual([]);
  });
});
