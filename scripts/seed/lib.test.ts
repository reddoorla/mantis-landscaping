import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import sharp from "sharp";

import {
  REPOSITORY,
  listAssets,
  makeLink,
  missingModels,
  modelsUsed,
  planAssets,
  resolveToken,
  splitReused,
  uploadName,
  uploadable,
  verifySha,
} from "./lib.mjs";

const sha = (bytes: Buffer) => createHash("sha256").update(bytes).digest("hex");

describe("the seed's token", () => {
  it("takes only the Mantis token", () => {
    expect(resolveToken({ PRISMIC_TOKEN_MANTIS_LANDSCAPING: "a", PRISMIC_WRITE_TOKEN: "x" })).toBe(
      "a",
    );
    expect(resolveToken({ MANTIS_LANDSCAPING_PRISMIC: "b", PRISMIC_WRITE_TOKEN: "x" })).toBe("b");
    expect(() => resolveToken({ PRISMIC_WRITE_TOKEN: "x" })).toThrow(
      /PRISMIC_WRITE_TOKEN is never read/,
    );
  });

  it("targets the Mantis repository, never the starter's placeholder", () => {
    expect(REPOSITORY).toBe("mantis-landscaping");
  });
});

describe("the seed's assets", () => {
  const manifest = {
    files: [
      { url: "https://cdn.test/site/a.jpg", sha256: "aa", bytes: 3 },
      { url: "https://cdn.test/site/b.gif", sha256: "bb", bytes: 4 },
    ],
  };

  it("plans each file from the capture manifest", () => {
    expect(planAssets(["b.gif"], manifest)).toEqual([
      { file: "b.gif", url: "https://cdn.test/site/b.gif", sha256: "bb", bytes: 4 },
    ]);
  });

  it("refuses a file the manifest does not list", () => {
    expect(() => planAssets(["a.jpg", "c.jpg"], manifest)).toThrow(/c\.jpg/);
  });

  it("refuses a file whose sha256 does not match the manifest", () => {
    const bytes = Buffer.from("original");
    expect(() => verifySha(bytes, sha(bytes), "a.jpg")).not.toThrow();
    expect(() => verifySha(Buffer.from("originaL"), sha(bytes), "a.jpg")).toThrow(/a\.jpg/);
  });

  it("re-encodes a GIF as a JPEG and leaves other files untouched", async () => {
    const gif = await sharp({
      create: { width: 4, height: 3, channels: 3, background: "#3a5" },
    })
      .gif()
      .toBuffer();
    const out = await uploadable("x.gif", gif, sharp);
    expect(out.name).toBe("x.jpg");
    expect((await sharp(out.bytes).metadata()).format).toBe("jpeg");

    const jpg = Buffer.from("jpeg bytes");
    expect(await uploadable("y.jpg", jpg, sharp)).toEqual({ name: "y.jpg", bytes: jpg });
  });
});

describe("the seed's links", () => {
  it("resolves a link to a document the seed creates", () => {
    const doc = { uid: "contact-us" };
    const link = makeLink(new Map([["page:contact-us", doc]]));
    expect(link("page:contact-us")()).toBe(doc);
  });

  it("throws on a link to a document the seed does not create", () => {
    const link = makeLink(new Map());
    expect(() => link("page:nowhere")()).toThrow(/page:nowhere/);
  });
});

describe("the seed's choice between an original and a resized copy", () => {
  const manifest = {
    files: [
      { url: "https://dv4.test/site/hero.jpg", sha256: "orig", bytes: 1908866 },
      { url: "https://d3s.test/site/w:1000/hero.jpg", sha256: "small", bytes: 134367 },
      { url: "https://d3s.test/site/w:1000/only-small.jpg", sha256: "s", bytes: 1 },
      { url: "https://a.test/twice.jpg", sha256: "a", bytes: 1 },
      { url: "https://b.test/twice.jpg", sha256: "b", bytes: 1 },
    ],
  };

  it("takes the original whichever order the manifest lists them in", () => {
    for (const files of [manifest.files, [...manifest.files].reverse()])
      expect(planAssets(["hero.jpg"], { files })[0]).toMatchObject({
        url: "https://dv4.test/site/hero.jpg",
        sha256: "orig",
      });
  });

  it("refuses a file with no original, or with two", () => {
    expect(() => planAssets(["only-small.jpg"], manifest)).toThrow(/0 original/);
    expect(() => planAssets(["twice.jpg"], manifest)).toThrow(/2 original/);
  });
});

describe("the seed's GIF handling", () => {
  it("names a GIF's upload .jpg whatever the case of its extension", () => {
    expect(uploadName("a.GIF")).toBe("a.jpg");
    expect(uploadName("a.gif")).toBe("a.jpg");
    expect(uploadName("a.jpg")).toBe("a.jpg");
  });

  it("flattens a transparent GIF onto white", async () => {
    const gif = await sharp({
      create: { width: 2, height: 2, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
    })
      .gif()
      .toBuffer();
    const out = await uploadable("t.GIF", gif, sharp);
    expect(out.name).toBe("t.jpg");
    const { data } = await sharp(out.bytes).raw().toBuffer({ resolveWithObject: true });
    expect(Math.min(...data)).toBeGreaterThan(240);
  });
});

describe("the seed's media-library read", () => {
  it("follows the cursor to the last page", async () => {
    const pages: Record<string, unknown> = {
      "https://asset-api.prismic.io/assets?limit=500": {
        items: [{ id: "1", filename: "a.jpg" }],
        cursor: "c2",
      },
      "https://asset-api.prismic.io/assets?limit=500&cursor=c2": {
        items: [{ id: "2", filename: "b.jpg" }],
      },
    };
    const asked: string[] = [];
    const byName = await listAssets(async (url: string) => {
      asked.push(url);
      return pages[url];
    });
    expect([...byName]).toEqual([
      ["a.jpg", "1"],
      ["b.jpg", "2"],
    ]);
    expect(asked).toHaveLength(2);
  });
});

describe("the seed's pre-flight", () => {
  const docs = [
    { type: "page", data: { slices: [{ slice_type: "page_title" }, { slice_type: "steps" }] } },
    { type: "project", data: { slices: [{ slice_type: "steps" }] } },
  ];

  it("lists the custom types and slices the documents use", () => {
    expect(modelsUsed(docs)).toEqual({
      types: ["page", "project"],
      slices: ["page_title", "steps"],
    });
  });

  it("names every model Prismic does not have, and passes when it has them all", () => {
    const used = modelsUsed(docs);
    expect(missingModels(used, { types: [], slices: [{ id: "steps" }] })).toEqual([
      "custom type page",
      "custom type project",
      "slice page_title",
    ]);
    expect(
      missingModels(used, {
        types: [{ id: "page" }, { id: "project" }],
        slices: [{ id: "steps" }, { id: "page_title" }],
      }),
    ).toEqual([]);
  });
});

describe("the seed's re-run", () => {
  it("reuses a photo the media library already holds, by its upload name, and fetches the rest", () => {
    const assets = [
      { file: "a.jpg", url: "u/a.jpg", sha256: "1", bytes: 1 },
      { file: "b.gif", url: "u/b.gif", sha256: "2", bytes: 1 },
      { file: "c.jpg", url: "u/c.jpg", sha256: "3", bytes: 1 },
    ];
    const { reuse, fetch } = splitReused(
      assets,
      new Map([
        ["a.jpg", "A"],
        ["b.jpg", "B"],
      ]),
    );
    expect([...reuse]).toEqual([
      ["a.jpg", "A"],
      ["b.gif", "B"],
    ]);
    expect(fetch.map((asset) => asset.file)).toEqual(["c.jpg"]);
  });
});
