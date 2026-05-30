import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import { moodboardDisplayName } from '../lib/moodboardDisplay';

type SearchableMoodboard = {
  id: number;
  name?: string | null;
  ownerUsername?: string | null;
};

const SearchContext = createContext<{
  query: string;
  setQuery: (query: string) => void;
} | null>(null);

export function SearchProvider({ children }: { children: ReactNode }) {
  const [query, setQuery] = useState('');
  const value = useMemo(() => ({ query, setQuery }), [query]);
  return <SearchContext.Provider value={value}>{children}</SearchContext.Provider>;
}

export function useSearch() {
  const ctx = useContext(SearchContext);
  if (!ctx) {
    throw new Error('useSearch must be used within SearchProvider');
  }
  return ctx;
}

export function matchesMoodboardSearch(board: SearchableMoodboard, query: string): boolean {
  const trimmed = query.trim().toLowerCase();
  if (!trimmed) {
    return true;
  }
  const name = moodboardDisplayName({ id: board.id, name: board.name ?? '' }).toLowerCase();
  const owner = board.ownerUsername?.toLowerCase() ?? '';
  return (
    name.includes(trimmed) ||
    owner.includes(trimmed) ||
    String(board.id).includes(trimmed)
  );
}
