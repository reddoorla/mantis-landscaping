// Style-census rows the OPERATOR has looked at and chosen to keep. Same
// contract as matching/floors.mjs: nothing is hidden, everything is counted
// under its own heading, and every entry needs a LEDGER entry to stay honest.
//
//   node matching/census-count.mjs <log>   -> "<real> <ambiguous> <declared>"
//
// Without this, `census.sh` can never reach zero and an "N remaining" figure
// says nothing about how much work is left — one permanent decision is counted
// once per page per viewport, so a single ACK can account for dozens of rows.

/** A row is `{ label, ref, cand }`, each of ref/cand a "fam | wt | size | lh |
 *  ls | transform | colour" tuple string. */
export const DECLARED = [];
