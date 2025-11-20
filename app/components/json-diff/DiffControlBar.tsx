"use client";

import { ArrowDown, ArrowUp } from "lucide-react";
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
}: DiffControlBarProps) {
  const hasDiffs = total > 0;

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-zinc-200/80 bg-white/80 p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/60">
      <div
        className={cn(
          "flex items-center gap-2 text-sm font-semibold",
          hasDiffs
            ? "text-zinc-900 dark:text-white"
            : "text-emerald-700 dark:text-emerald-300"
        )}
      >
        {canCompare ? (hasDiffs ? activeLabel : sameLabel) : null}
      </div>
      <div className="flex items-center gap-2">
        <Button
          type="button"
          size="icon-sm"
          variant="ghost"
          disabled={!hasDiffs}
          onClick={onPrev}
          aria-label={hints.prev}
        >
          <ArrowUp className="size-4" />
        </Button>
        <Button
          type="button"
          size="icon-sm"
          variant="ghost"
          disabled={!hasDiffs}
          onClick={onNext}
          aria-label={hints.next}
        >
          <ArrowDown className="size-4" />
        </Button>
        {hasDiffs && (
          <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
            {currentIndex + 1} / {total}
          </span>
        )}
      </div>
    </div>
  );
}
