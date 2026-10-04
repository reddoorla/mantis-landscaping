import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import sharp from "sharp";

import {
  HEADER_LIMIT,
  readIds,
  send,
  updateRelease,
  REPOSITORY,
  listAssets,
  makeIdLink,
  metadataBytes,
  stripXmp,
  unsized,
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

    const jpg = await sharp({ create: { width: 2, height: 2, channels: 3, background: "#fff" } })
      .jpeg()
      .toBuffer();
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
  it("follows the cursor to the last page, and prefers a copy Prismic sized", async () => {
    const pages: Record<string, unknown> = {
      "https://asset-api.prismic.io/assets?limit=500": {
        items: [
          { id: "1", filename: "a.jpg", width: 10, height: 10 },
          { id: "2u", filename: "b.jpg", width: null, height: null },
        ],
        cursor: "c2",
      },
      "https://asset-api.prismic.io/assets?limit=500&cursor=c2": {
        items: [
          { id: "2", filename: "b.jpg", width: 4, height: 3 },
          { id: "3u", filename: "c.jpg" },
        ],
      },
    };
    const asked: string[] = [];
    const byName = await listAssets(async (url: string) => {
      asked.push(url);
      return pages[url];
    });
    expect([...byName].map(([name, { id, sized }]) => [name, id, sized])).toEqual([
      ["a.jpg", "1", true],
      ["b.jpg", "2", true],
      ["c.jpg", "3u", false],
    ]);
    expect(asked).toHaveLength(2);
    expect(unsized(byName)).toEqual([
      { name: "b.jpg", id: "2u" },
      { name: "c.jpg", id: "3u" },
    ]);
  });

  it("counts an asset with only one dimension as unsized", async () => {
    const byName = await listAssets(async () => ({
      items: [{ id: "w", filename: "w.jpg", width: 10, height: null }],
    }));
    expect(byName.get("w.jpg")?.sized).toBe(false);
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
  it("reuses a sized photo the library holds, by its upload name, and fetches the rest", () => {
    const assets = [
      { file: "a.jpg", url: "u/a.jpg", sha256: "1", bytes: 1 },
      { file: "b.gif", url: "u/b.gif", sha256: "2", bytes: 1 },
      { file: "c.jpg", url: "u/c.jpg", sha256: "3", bytes: 1 },
      { file: "d.jpg", url: "u/d.jpg", sha256: "4", bytes: 1 },
    ];
    const { reuse, fetch } = splitReused(
      assets,
      new Map([
        ["a.jpg", { id: "A", sized: true }],
        ["b.jpg", { id: "B", sized: true }],
        ["d.jpg", { id: "D", sized: false }],
      ]),
    );
    expect([...reuse]).toEqual([
      ["a.jpg", "A"],
      ["b.gif", "B"],
    ]);
    expect(fetch.map((asset) => asset.file)).toEqual(["c.jpg", "d.jpg"]);
  });

  it("links by document id when it updates an existing release", () => {
    const link = makeIdLink({ "page:contact-us": "X1" });
    expect(link("page:contact-us")).toEqual({ link_type: "Document", id: "X1" });
    expect(() => link("page:nowhere")).toThrow(/page:nowhere/);
  });
});

const segment = (marker: number, payload: Buffer) =>
  Buffer.concat([
    Buffer.from([0xff, marker, (payload.length + 2) >> 8, (payload.length + 2) & 0xff]),
    payload,
  ]);

async function jpegWithXmp(xmpBytes: number) {
  const plain = await sharp({ create: { width: 3, height: 2, channels: 3, background: "#3a5" } })
    .jpeg()
    .toBuffer();
  const exif = segment(0xe1, Buffer.concat([Buffer.from("Exif\0\0", "latin1"), Buffer.alloc(20)]));
  const xmp = segment(
    0xe1,
    Buffer.concat([Buffer.from("http://ns.adobe.com/xap/1.0/\0", "latin1"), Buffer.alloc(200)]),
  );
  const chunks = [];
  for (let left = xmpBytes; left > 0; left -= 60000)
    chunks.push(
      segment(
        0xe1,
        Buffer.concat([
          Buffer.from("http://ns.adobe.com/xmp/extension/\0", "latin1"),
          Buffer.alloc(Math.min(left, 60000)),
        ]),
      ),
    );
  return Buffer.concat([plain.subarray(0, 2), exif, xmp, ...chunks, plain.subarray(2)]);
}

describe("the seed's metadata strip", () => {
  it("removes XMP and extended XMP and keeps the image and its EXIF", async () => {
    const heavy = await jpegWithXmp(200000);
    expect(metadataBytes(heavy)).toBeGreaterThan(200000);
    const light = stripXmp(heavy);
    expect(metadataBytes(light)).toBeLessThan(1000);
    expect(light.includes(Buffer.from("Exif\0\0", "latin1"))).toBe(true);
    expect(light.includes(Buffer.from("http://ns.adobe.com/", "latin1"))).toBe(false);
    const [a, b] = await Promise.all([
      sharp(heavy).raw().toBuffer(),
      sharp(light).raw().toBuffer(),
    ]);
    expect(a.equals(b)).toBe(true);
  });

  it("uploads the stripped bytes, under the limit Prismic can read dimensions within", async () => {
    const out = await uploadable("p.jpg", await jpegWithXmp(1900000), sharp);
    expect(out.name).toBe("p.jpg");
    expect(metadataBytes(out.bytes)).toBeLessThanOrEqual(HEADER_LIMIT);
  });

  it("refuses a file whose other metadata alone is still too large", async () => {
    const plain = await sharp({ create: { width: 3, height: 2, channels: 3, background: "#000" } })
      .jpeg()
      .toBuffer();
    const icc = Array.from({ length: 2 }, () => segment(0xe2, Buffer.alloc(60000)));
    const heavy = Buffer.concat([plain.subarray(0, 2), ...icc, plain.subarray(2)]);
    await expect(uploadable("q.jpg", heavy, sharp)).rejects.toThrow(/q\.jpg/);
  });
});

describe("the seed's segment walk fails closed", () => {
  const sosTail = Buffer.from([0xff, 0xda, 0x00, 0x02, 0x00, 0xff, 0xd9]);
  const app = (marker: number, size: number) => segment(marker, Buffer.alloc(size));
  const xmp = segment(
    0xe1,
    Buffer.concat([
      Buffer.from("http://ns.adobe.com/xmp/extension/\0", "latin1"),
      Buffer.alloc(65000),
    ]),
  );

  it("skips fill bytes and standalone markers, and still strips the XMP behind them", () => {
    const file = Buffer.concat([
      Buffer.from([0xff, 0xd8]),
      Buffer.from([0xff]),
      xmp,
      Buffer.from([0xff, 0x01]),
      app(0xe0, 14),
      sosTail,
    ]);
    const stripped = stripXmp(file);
    expect(stripped.includes(Buffer.from("http://ns.adobe.com/", "latin1"))).toBe(false);
    expect(metadataBytes(stripped)).toBeLessThan(40);
  });

  it.each([
    ["a zero-length segment", Buffer.from([0xff, 0xd8, 0xff, 0xe1, 0x00, 0x00, ...sosTail])],
    ["a segment running past the end", Buffer.from([0xff, 0xd8, 0xff, 0xe1, 0x7f, 0xff, 0x00])],
    ["no start-of-scan", Buffer.concat([Buffer.from([0xff, 0xd8]), app(0xe0, 14)])],
    ["a stray byte between segments", Buffer.concat([Buffer.from([0xff, 0xd8, 0x00]), sosTail])],
    ["not a JPEG", Buffer.from("plain text")],
  ])("reports %s as unmeasurable, so the upload is refused", async (_, bytes) => {
    expect(metadataBytes(bytes)).toBe(Infinity);
    expect(stripXmp(bytes)).toBe(bytes);
    await expect(uploadable("z.jpg", bytes, sharp)).rejects.toThrow(/z\.jpg/);
  });

  it("refuses one byte over the largest header Prismic has sized, and takes exactly that size", async () => {
    const at = (size: number) => {
      const pad = size - 2 - 4;
      return Buffer.concat([Buffer.from([0xff, 0xd8]), segment(0xe0, Buffer.alloc(pad)), sosTail]);
    };
    expect(metadataBytes(at(HEADER_LIMIT))).toBe(HEADER_LIMIT);
    await expect(uploadable("ok.jpg", at(HEADER_LIMIT), sharp)).resolves.toMatchObject({
      name: "ok.jpg",
    });
    await expect(uploadable("big.jpg", at(HEADER_LIMIT + 1), sharp)).rejects.toThrow(/big\.jpg/);
  });

  it("refuses a format it does not handle", async () => {
    const png = await sharp({ create: { width: 2, height: 2, channels: 3, background: "#fff" } })
      .png()
      .toBuffer();
    await expect(uploadable("x.png", png, sharp)).rejects.toThrow(
      /x\.png is neither a JPEG nor a GIF/,
    );
  });
});

describe("the seed's --update argument", () => {
  it("reads the ids file, and refuses a missing one", () => {
    expect(readIds(["node", "seed.mjs"])).toBeNull();
    expect(readIds(["node", "seed.mjs", "--update", "ids.json"])).toBe("ids.json");
    expect(() => readIds(["node", "seed.mjs", "--update"])).toThrow(/--update needs/);
    expect(() => readIds(["node", "seed.mjs", "--update", "--publish"])).toThrow(/--update needs/);
  });
});

describe("the seed's requests", () => {
  const reply = (status: number, body: unknown = {}, headers: Record<string, string> = {}) =>
    ({
      status,
      ok: status < 300,
      headers: { get: (k: string) => headers[k] ?? null },
      json: async () => body,
      text: async () => JSON.stringify(body),
    }) as unknown as Response;

  it("retries a 429, honouring retry-after, then gives up after the last try", async () => {
    const waits: number[] = [];
    let calls = 0;
    const ok = await send(
      async () => (++calls < 3 ? reply(429, {}, { "retry-after": "2" }) : reply(200)),
      "u",
      {},
      { sleep: async (ms: number) => void waits.push(ms) },
    );
    expect(ok.status).toBe(200);
    expect(waits).toEqual([2000, 2000]);
    calls = 0;
    const last = await send(
      async () => (++calls, reply(429)),
      "u",
      {},
      { tries: 2, sleep: async () => {} },
    );
    expect([last.status, calls]).toEqual([429, 2]);
  });

  const docs = (img: (f: string, a: string | null) => unknown, link: (t: string) => unknown) => [
    {
      type: "page",
      uid: "home",
      title: "Home",
      data: { image: img("a.jpg", "Alt A"), cta: link("page:home") },
    },
  ];

  it("uploads only what is missing, then PUTs each document by id with assets and links resolved", async () => {
    const calls: Array<{ url: string; method?: string; body?: unknown }> = [];
    const fetchImpl = async (url: string, init: RequestInit) => {
      calls.push({ url, method: init.method, body: init.body });
      if (url.endsWith("/assets")) return reply(200, { id: "NEW", width: 4, height: 3 });
      return reply(200);
    };
    const files = new Map<string, { id?: string; name?: string; bytes?: Buffer }>([
      ["a.jpg", { name: "a.jpg", bytes: Buffer.from("x") }],
    ]);
    await updateRelease({
      docs,
      files,
      alts: new Map([["a.jpg", "Alt A"]]),
      ids: { "page:home": "DOC1" },
      headers: { repository: "r" },
      fetch: fetchImpl,
      sleep: async () => {},
    });
    expect(calls.map((c) => `${c.method} ${c.url}`)).toEqual([
      "POST https://asset-api.prismic.io/assets",
      "PUT https://migration.prismic.io/documents/DOC1",
    ]);
    expect(JSON.parse(calls[1].body as string)).toEqual({
      uid: "home",
      title: "Home",
      data: { image: { id: "NEW", alt: "Alt A" }, cta: { link_type: "Document", id: "DOC1" } },
    });
  });

  it("stops when Prismic sizes no upload, before touching any document", async () => {
    const urls: string[] = [];
    await expect(
      updateRelease({
        docs,
        files: new Map([["a.jpg", { name: "a.jpg", bytes: Buffer.from("x") }]]),
        alts: new Map(),
        ids: { "page:home": "DOC1" },
        headers: {},
        fetch: async (url: string) => {
          urls.push(url);
          return reply(200, { id: "U", width: null, height: null });
        },
        sleep: async () => {},
      }),
    ).rejects.toThrow(/no dimensions for a\.jpg/);
    expect(urls).toEqual(["https://asset-api.prismic.io/assets"]);
  });
});
