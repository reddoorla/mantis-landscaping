// Count one style-census log, splitting declared deviations out of the total.
//
//   node matching/census-count.mjs matching/census-home-1440.log
//   -> "<real> <ambiguous> <declared>"
//
// census.sh calls this per page/viewport. Parsing the log rather than importing
// style-census keeps the project's declared-deviation policy out of the shared
// skill — the skill reports what it sees; the project decides what it has
// already agreed to.
import { readFileSync } from "node:fs";
import { DECLARED } from "./census-deviations.mjs";

const path = process.argv[2];
if (!path) {
  console.error("usage: census-count.mjs <census log>");
  process.exit(2);
}

// A log that cannot be READ is not a log with nothing IN it. This printed
// "0 0 0" and exited 0, and census.sh added that to its total — the same green
// it used to grant for a style-census that never ran. There is no count to
// give here; say so and let the caller decide, which is never zero.
let text = "";
try {
  text = readFileSync(path, "utf8");
} catch (e) {
  console.error(`census-count: cannot read ${path} — ${e.message}`);
  console.error("              a missing log is not a census with no findings.");
  process.exit(2);
}

const [head, tail = ""] = text.split("--- AMBIGUOUS");

/** Pull `{label, ref, cand}` rows out of a census section. */
function rows(section) {
  const out = [];
  const lines = section.split("\n");
  for (let i = 0; i < lines.length; i++) {
    if (!/^ {2}y=/.test(lines[i])) continue;
    const label = lines[i].replace(/^\s*y=\s*\d+\s*/, "").trim();
    const refs = [];
    const cands = [];
    for (
      let j = i + 1;
      j < lines.length && /^ {4}(ref|cand):/.test(lines[j]);
      j++
    ) {
      const v = lines[j].replace(/^\s*(ref|cand):\s*/, "").trim();
      (lines[j].trim().startsWith("ref:") ? refs : cands).push(v);
    }
    if (refs.length && cands.length)
      out.push({ label, ref: refs[0], cand: cands[0] });
    else out.push({ label, ref: refs[0] ?? "", cand: cands[0] ?? "" });
  }
  return out;
}

const mism = rows(head);
const amb = rows(tail);
const declared = mism.filter((r) => DECLARED.some((d) => d.match(r)));
console.log(
  `${mism.length - declared.length} ${amb.length} ${declared.length}`,
);
