// @vitest-environment node
//
// Node, not jsdom: this test imports the real svelte.config.js, which pulls in
// @sveltejs/adapter-netlify and therefore esbuild — and esbuild refuses to load
// under jsdom ("new TextEncoder().encode('') instanceof Uint8Array is
// incorrectly false", a cross-realm Uint8Array). Asserting against the actual
// exported config is the whole point; a hand-copied policy would prove nothing.
import { afterEach, describe, it, expect, vi } from "vitest";
import { readFileSync } from "node:fs";
import { SVELTE_EVENT_REPLAY_HASH } from "@reddoorla/maintenance/configs/svelte";

// The served policy is asserted where it is authored. Svelte 5 server-renders
// `onload="this.__e=event"` (and onerror) on every element that takes an
// attribute spread — i.e. every `<img {...getImageProps(field)} />` the Prismic
// helpers produce — as its replay stub for a load/error that fires before
// hydration. A nonce never covers an event-handler ATTRIBUTE, so without both
// 'unsafe-hashes' and the stub's own hash the browser refuses to run it: the
// pre-hydration load is dropped and one violation is POSTed to /api/csp-report
// per image, per page view (12 on `/` alone, measured on beachfront-dentistry
// 2026-08-13), burying real violations under the noise.
type CspConfig = {
  kit?: { csp?: { directives?: Record<string, string[]> } };
};
const { default: config } = (await import("../svelte.config.js")) as unknown as {
  default: CspConfig;
};
const scriptSrc = config.kit?.csp?.directives?.["script-src"] ?? [];

describe("the template's Content-Security-Policy", () => {
  it("allows Svelte's SSR event-replay stub by its exact hash", () => {
    expect(scriptSrc).toContain("unsafe-hashes");
    expect(scriptSrc).toContain(SVELTE_EVENT_REPLAY_HASH);
  });

  // 'unsafe-hashes' widens hash matching to event handlers and nothing else, so
  // only that one-liner is allowed. Paired with 'unsafe-inline' the guarantee
  // is gone — every injected inline script would run too.
  it("never pairs that with 'unsafe-inline'", () => {
    expect(scriptSrc).not.toContain("unsafe-inline");
  });

  // The hash is imported, never transcribed: a copied string cannot be told
  // apart from a stale one, and the stub's text is upstream's to change.
  it("takes the hash from the shared config package, not a local copy", async () => {
    const source = await import("node:fs").then((fs) =>
      fs.readFileSync(new URL("../svelte.config.js", import.meta.url), "utf-8"),
    );
    expect(source).toContain("SVELTE_EVENT_REPLAY_HASH");
    expect(source).not.toContain(SVELTE_EVENT_REPLAY_HASH);
  });
});

describe("the Prismic toolbar under this site's policy", () => {
  const directives = config.kit?.csp?.directives ?? {};
  const slicemachine = JSON.parse(
    readFileSync(new URL("../slicemachine.config.json", import.meta.url), "utf8"),
  ) as { repositoryName: string };
  const repository = process.env.VITE_PRISMIC_ENVIRONMENT || slicemachine.repositoryName;
  const matching = (directive: string, needle: string) =>
    ((directives as Record<string, string[] | undefined>)[directive] ?? []).filter((source) =>
      source.includes(needle),
    );

  it("lets the toolbar scripts load from prismic.io's toolbar path, and nothing else there", () => {
    expect(matching("script-src", "prismic.io")).toEqual([
      "https://static.cdn.prismic.io",
      "https://prismic.io/prismic-toolbar/",
    ]);
  });

  it("lets the toolbar's Share button load html2canvas, and only that file", () => {
    expect(matching("script-src", "hertzen.com")).toEqual([
      "https://html2canvas.hertzen.com/dist/html2canvas.min.js",
    ]);
  });

  it("frames only this site's own Prismic repository", () => {
    expect(matching("frame-src", "prismic.io")).toEqual([`https://${repository}.prismic.io`]);
  });

  describe("when VITE_PRISMIC_ENVIRONMENT names the repository", () => {
    afterEach(() => {
      vi.unstubAllEnvs();
      vi.resetModules();
    });

    const load = async (name: string) => {
      vi.stubEnv("VITE_PRISMIC_ENVIRONMENT", name);
      vi.resetModules();
      return (await import("../svelte.config.js")).default;
    };

    it("frames that repository, not slicemachine's", async () => {
      const loaded = await load("other-repo");
      expect(
        (loaded.kit?.csp?.directives?.["frame-src"] ?? []).filter((s: string) =>
          s.includes("prismic.io"),
        ),
      ).toEqual(["https://other-repo.prismic.io"]);
    });

    it("refuses a name that would write another directive into the policy", async () => {
      await expect(load("x; script-src *")).rejects.toThrow("is not a repository name");
    });
  });
});
