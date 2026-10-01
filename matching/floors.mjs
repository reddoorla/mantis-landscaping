// The failures we have already established are NOT geometry. Shared by
// next.mjs (which reports them separately from the backlog) and strikes.mjs
// (which must not report them as stalled — a region that cannot move is flat
// by definition, and three strikes on one is noise that hides a real stall).
// Every entry needs a matching LEDGER entry to stay honest.
//
// NOTE the second matcher argument. Region records carry `label` and
// `viewport` but not the page, so an entry keyed on label+viewport alone is
// safe only where the label is unique site-wide. "top" is not — every page has
// one — so such an entry would silently accept the `top` failure on EVERY page
// and hide every real one. next.mjs and strikes.mjs pass the page key as the
// second argument: take `(r, page)` unless you have checked the label.

/** Reference behaviour we cannot reproduce (declared floors). */
export const FLOORS = [];

/** Regions the OPERATOR has looked at and chosen to leave failing. These are
 *  not floors and are not silently dropped: next.mjs prints them under their
 *  own heading with the decision, so the number never quietly improves. */
export const ACCEPTED = [];
