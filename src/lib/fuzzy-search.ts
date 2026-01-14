import uFuzzy from '@leeoniya/ufuzzy';

// Use MultiInsert mode (intraMode: 0) which allows gaps between characters
// This is more forgiving for partial/incomplete searches like "alr" -> "alert"
const uf = new uFuzzy({
  intraMode: 0, // MultiInsert mode - allows multiple insertions between chars
  intraIns: 3, // Max 3 inserted chars between term chars
  interIns: Infinity, // Allow any gap between search terms
  intraChars: '[a-z\\d-]', // Match alphanumeric + hyphens
});

/**
 * Perform fuzzy search on an array of strings
 * @param haystack - Array of strings to search
 * @param needle - Search query
 * @returns Sorted array of matching strings (best matches first)
 */
export function fuzzySearch(haystack: string[], needle: string): string[] {
  if (!needle?.trim()) {
    return haystack;
  }

  const normalizedNeedle = needle.trim().toLowerCase();

  const [idxs, info, order] = uf.search(
    haystack,
    normalizedNeedle,
    1,
    1000
  );

  if (!idxs?.length || !order?.length) {
    return [];
  }

  const results = order.map((i) => haystack[idxs[i]]);

  return results;
}
