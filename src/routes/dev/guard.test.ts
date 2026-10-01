// The /dev guard's three builds (reddoor-maintenance#948), and the Netlify
// refusal that keeps the gate's flag out of a deploy. See +layout.server.ts.
import { afterEach, describe, expect, it, vi } from "vitest";
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const FLAG = "VITE_REDDOOR_GATE_FIXTURES";

async function loadUnder(dev: boolean): Promise<() => void> {
  vi.resetModules();
  vi.doMock("$app/environment", () => ({ dev, browser: false, building: false, version: "" }));
  const mod = await import("./+layout.server");
  return mod.load as () => void;
}

function statusOf(run: () => void): number | "none" {
  try {
    run();
    return "none";
  } catch (e) {
    return (e as { status?: number }).status ?? -1;
  }
}

describe("/dev guard", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.doUnmock("$app/environment");
  });

  it("a production build without the flag answers 404", async () => {
    vi.stubEnv(FLAG, "");
    expect(statusOf(await loadUnder(false))).toBe(404);
  });

  it('a production build with any value but "1" still answers 404', async () => {
    vi.stubEnv(FLAG, "true");
    expect(statusOf(await loadUnder(false))).toBe(404);
  });

  it("the a11y gate's build, made with the flag, serves the fixtures", async () => {
    vi.stubEnv(FLAG, "1");
    expect(statusOf(await loadUnder(false))).toBe("none");
  });

  it("the dev server serves the fixtures, with or without the flag", async () => {
    vi.stubEnv(FLAG, "");
    expect(statusOf(await loadUnder(true))).toBe("none");
  });
});

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");

// reddoor-maintenance's launch pre-flight (`carriesGuard`) recognises this
// guard only as a literal `if (!dev)` whose own branch refuses. A flattened
// `if (!dev && …)` behaves the same and blocks launch.
describe("/dev guard shape", () => {
  it("keeps the refusal inside a literal `if (!dev)` branch", () => {
    const code = readFileSync(resolve(repoRoot, "src/routes/dev/+layout.server.ts"), "utf-8")
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .replace(/\/\/.*$/gm, "");
    expect(code).toMatch(/if\s*\(\s*!\s*dev\s*\)\s*\{[^}]*error\s*\(\s*404/);
  });
});

function importConfigUnder(env: { netlify?: boolean; flag?: boolean }) {
  const child = { ...process.env };
  delete child.CI;
  delete child.NETLIFY;
  delete child.VITE_PRISMIC_ENVIRONMENT;
  delete child[FLAG];
  if (env.netlify) child.NETLIFY = "true";
  if (env.flag) child[FLAG] = "1";
  const r = spawnSync(process.execPath, ["-e", `import("./svelte.config.js")`], {
    cwd: repoRoot,
    env: child,
    encoding: "utf-8",
  });
  return { status: r.status, stderr: r.stderr };
}

describe("svelte.config.js and the gate's flag", () => {
  it("loads with the flag off Netlify: the a11y gate's build, in CI or locally", () => {
    const r = importConfigUnder({ flag: true });
    expect(r.stderr).toBe("");
    expect(r.status).toBe(0);
  });

  it("loads on Netlify without the flag (the control)", () => {
    const r = importConfigUnder({ netlify: true });
    expect(r.stderr).toBe("");
    expect(r.status).toBe(0);
  });

  it("refuses the flag on Netlify, naming it", () => {
    const r = importConfigUnder({ netlify: true, flag: true });
    expect(r.status).not.toBe(0);
    expect(r.stderr).toContain(`${FLAG} is set on Netlify`);
  });
});
