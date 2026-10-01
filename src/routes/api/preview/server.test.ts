import { describe, expect, it, vi } from "vitest";

const resolvePreviewURL = vi.hoisted(() =>
  vi.fn(
    async (args: {
      documentID?: string;
      previewToken?: string;
      defaultURL: string;
      linkResolver?: (doc: unknown) => string | null;
    }) => {
      if (args.documentID !== "X" || args.previewToken !== "abc") return args.defaultURL;
      if (args.defaultURL !== "/") throw new Error(`unexpected defaultURL ${args.defaultURL}`);
      return args.linkResolver?.({ type: "page", uid: "about" }) ?? args.defaultURL;
    },
  ),
);

vi.mock("$lib/prismicio", async () => {
  const actual = await vi.importActual<typeof import("$lib/prismicio")>("$lib/prismicio");
  return { ...actual, createClient: () => ({ resolvePreviewURL }) };
});

const { GET } = await import("./+server");

describe("GET /api/preview", () => {
  it("sends an editor to the previewed document's own route, not the home page", async () => {
    const cookies = { set: vi.fn() };
    const response = await GET({
      fetch: globalThis.fetch,
      request: new Request("https://example.com/api/preview?token=abc&documentId=X"),
      cookies,
    } as never);
    expect(response.status).toBe(307);
    expect(response.headers.get("Location")).toBe("/preview/about");
    expect(cookies.set).toHaveBeenCalledWith("io.prismic.preview", "abc", expect.anything());
  });

  it("lets a failed lookup fail the request rather than redirecting home", async () => {
    resolvePreviewURL.mockRejectedValueOnce(new Error("expired token"));
    await expect(
      GET({
        fetch: globalThis.fetch,
        request: new Request("https://example.com/api/preview?token=abc&documentId=X"),
        cookies: { set: vi.fn() },
      } as never),
    ).rejects.toThrow("expired token");
  });
});
