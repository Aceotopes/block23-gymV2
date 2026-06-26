// Fuzzy name matching for the non-blocking duplicate warning on registration
// (US-2.1: "warns — does not block"). Deliberately lenient: catches the common
// data-entry duplicates (case/spacing/diacritics/word-order, or one name nested in
// another) without trying to be a full similarity engine. It only ever WARNS.

export function normalizeName(name: string): string {
  return name
    .normalize("NFKD")
    .replace(/\p{Diacritic}/gu, "") // strip combining accents
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "") // drop punctuation
    .replace(/\s+/g, " ")
    .trim();
}

export function isSimilarName(a: string, b: string): boolean {
  const na = normalizeName(a);
  const nb = normalizeName(b);
  if (!na || !nb) return false;
  if (na === nb) return true;
  // One name fully nested in the other ("jon" vs "jon doe").
  if (
    na.length >= 3 &&
    nb.length >= 3 &&
    (na.includes(nb) || nb.includes(na))
  ) {
    return true;
  }
  // Same set of words in any order ("doe john" vs "john doe").
  const tokens = (s: string) => [...new Set(s.split(" "))].sort().join(" ");
  return tokens(na) === tokens(nb);
}
