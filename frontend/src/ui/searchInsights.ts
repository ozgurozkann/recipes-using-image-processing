const STORAGE_KEY = "recipe-ai-search-insights";
const MAX_TERMS = 12;

type SearchEntry = {
  term: string;
  source: "recipe" | "ingredient" | "recommendation";
  at: number;
};

function readEntries(): SearchEntry[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function recordSearchTerm(term: string, source: SearchEntry["source"]): void {
  const clean = term.trim();
  if (clean.length < 2) return;
  const entries = readEntries().filter((entry) => entry.term.toLocaleLowerCase("tr-TR") !== clean.toLocaleLowerCase("tr-TR"));
  const next = [{ term: clean, source, at: Date.now() }, ...entries].slice(0, MAX_TERMS);
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
}

export function getRecentSearchTerms(): SearchEntry[] {
  return readEntries().sort((a, b) => b.at - a.at).slice(0, MAX_TERMS);
}
