"use client";

import { ArrowDown, ArrowUp, ChevronDown, ChevronUp } from "lucide-react";
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

  if (!canCompare) {
    return null;
  }

  return (
    <div className="flex flex-wrap items-center justify-end gap-4 ">
      <div
        className={cn(
          "flex items-center gap-4 text-sm font-semibold",
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
