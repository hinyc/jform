"use client";

import {
  ArrowDown,
  ArrowUp,
  ChevronDown,
  ChevronUp,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type DiffControlBarProps = {
  total: number;
  currentIndex: number;
  onPrev: () => void;
  onNext: () => void;
  activeLabel: string;
  sameLabel: string;
  hints: {
    prev: string;
    next: string;
  };
  canCompare: boolean;
  mode: "edit" | "view";
  searchQuery: string;
  onSearchChange: (query: string) => void;
  searchResults?: {
    leftLines: number[];
    rightLines: number[];
  };
  onSearchResults?: (results: {
    leftLines: number[];
    rightLines: number[];
  }) => void;
  currentSearchIndex: number;
  onSearchPrev: () => void;
  onSearchNext: () => void;
};

export function DiffControlBar({
  total,
  currentIndex,
  onPrev,
  onNext,
  activeLabel,
  sameLabel,
  hints,
  canCompare,
  mode,
  searchQuery,
  onSearchChange,
  searchResults,
  onSearchResults,
  currentSearchIndex,
  onSearchPrev,
  onSearchNext,
}: DiffControlBarProps) {
  const hasDiffs = total > 0;
  const totalSearchResults =
    (searchResults?.leftLines?.length || 0) +
    (searchResults?.rightLines?.length || 0);

  if (!canCompare) {
    return null;
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      const currentValue = e.currentTarget.value.trim();
      // If search query is unchanged and there are results, move to next
      if (currentValue === searchQuery && totalSearchResults > 0) {
        e.preventDefault();
        onSearchNext();
      }
      // If search query changed, onChange already handles new search
    }
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      {/* Search Bar - Only in View Mode */}
      {mode === "view" && (
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search..."
              className="h-9 w-64 rounded-lg border border-zinc-200 bg-white pl-9 pr-3 text-sm outline-none transition focus:border-brand-primary-500 focus:ring-2 focus:ring-brand-primary-500/20 dark:border-zinc-700 dark:bg-zinc-900 dark:focus:border-brand-primary-400"
            />
          </div>

          {/* Search Results Counter */}
          {totalSearchResults > 0 && (
            <>
              <span className="text-sm font-semibold text-zinc-500 dark:text-zinc-400">
                <span className="inline-block w-8 text-right">
                  {currentSearchIndex + 1}
                </span>
                &nbsp;/ {totalSearchResults}
              </span>

              {/* Search Navigation */}
              <div className="flex items-center">
                <Button
                  type="button"
                  size="icon-sm"
                  variant="ghost"
                  onClick={onSearchPrev}
                  aria-label="Previous search result"
                >
                  <ChevronUp className="size-6 text-zinc-500 dark:text-zinc-400" />
                </Button>
                <Button
                  type="button"
                  size="icon-sm"
                  variant="ghost"
                  onClick={onSearchNext}
                  aria-label="Next search result"
                >
                  <ChevronDown className="size-6 text-zinc-500 dark:text-zinc-400" />
                </Button>
              </div>
            </>
          )}
        </div>
      )}

      {/* Diff Counter and Navigation */}
      <div
        className={cn(
          "flex items-center gap-4 text-sm font-semibold",
          mode === "view" ? "ml-auto" : "",
          hasDiffs
            ? "text-zinc-900 dark:text-white"
            : "text-emerald-700 dark:text-emerald-300"
        )}
      >
        {hasDiffs ? (
          <div className="flex items-center gap-4">
            <span className="text-md font-semibold text-zinc-500 dark:text-zinc-400">
              <span className="font-bold">{activeLabel}</span>
              <span className="inline-block w-10 text-right">
                {currentIndex + 1}
              </span>
              &nbsp;/ {total}
            </span>
            <div className="flex items-center">
              <Button
                type="button"
                size="icon-sm"
                variant="ghost"
                disabled={!hasDiffs}
                onClick={onPrev}
                aria-label={hints.prev}
              >
                <ChevronUp className="size-6 text-zinc-500 dark:text-zinc-400" />
              </Button>
              <Button
                type="button"
                size="icon-sm"
                variant="ghost"
                disabled={!hasDiffs}
                onClick={onNext}
                aria-label={hints.next}
              >
                <ChevronDown className="size-6 text-zinc-500 dark:text-zinc-400" />
              </Button>
            </div>
          </div>
        ) : (
          sameLabel
        )}
      </div>
    </div>
  );
}
