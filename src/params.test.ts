import { describe, it, expect } from "vitest";

import { params } from "./params";

/**
 * Kit 3 changed what a matcher means: it returns the param's value, and only
 * `undefined` fails. Kit 2's boolean `param === "preview"`, lifted as written,
 * returns `false` for "about", which kit 3 takes as a match, so
 * `[[preview=preview]]` would swallow every first segment. This runs the
 * matcher through kit's own validate path, so a boolean matcher goes red here.
 */
function run(segment: string): unknown {
  const result = params.preview["~standard"].validate(segment) as
    { value: unknown } | { issues: unknown[] };
  return "issues" in result ? undefined : result.value;
}

describe("the [[preview=preview]] matcher", () => {
  it("matches only the literal segment", () => {
    expect(run("preview")).toBe("preview");
  });

  it("rejects anything else, including near misses", () => {
    for (const segment of ["previews", "Preview", "preview/", "", "about", "services"]) {
      expect(run(segment), `"${segment}" was taken for the preview segment`).toBeUndefined();
    }
  });
});
