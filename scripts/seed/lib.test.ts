import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import sharp from "sharp";

import {
  REPOSITORY,
  assetConflicts,
  makeLink,
  planAssets,
  resolveToken,
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

  it("refuses when the media library already holds a planned file", () => {
    expect(assetConflicts(["a.jpg", "b.jpg"], ["b.jpg", "z.jpg"])).toEqual(["b.jpg"]);
    expect(assetConflicts(["a.jpg"], [])).toEqual([]);
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
