"use client";

import type { MutableRefObject } from "react";
import { DiffResult, DiffType } from "@/lib/utils/compareObjects";
import { cn } from "@/lib/utils";

type DiffBlockListProps = {
  diffs: DiffResult[];
  activeIndex: number;
  onSelect: (index: number) => void;
  blockRefs: MutableRefObject<(HTMLDivElement | null)[]>;
  labels: {
    left: string;
    right: string;
    empty: string;
  };
  typeLabels: Record<DiffType, string>;
};

export function DiffBlockList({
  diffs,
  activeIndex,
  onSelect,
  blockRefs,
  labels,
  typeLabels,
}: DiffBlockListProps) {
  if (!diffs.length) {
    return null;
  }

  return (
    <div className="space-y-4">
      {diffs.map((diff, index) => {
        const isActive = index === activeIndex;
        return (
          <div
            key={`${diff.path}-${index}`}
            ref={(element) => {
              blockRefs.current[index] = element;
            }}
            className={cn(
              "cursor-pointer rounded-xl border px-4 py-2 transition-shadow dark:border-zinc-800",
              isActive
                ? "border-zinc-300 border-2 shadow-lg dark:border-white/70"
                : "border-zinc-200 shadow-sm hover:border-zinc-300 dark:hover:border-white/50"
            )}
            onClick={() => onSelect(index)}
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="text-sm font-semibold text-zinc-700 dark:text-zinc-200">
                <span className="font-mono">{formatPath(diff.path)}</span>
              </div>
              <span
                className={cn(
                  "rounded-full px-3 py-1 text-xs font-medium",
                  badgeColors[diff.type]
                )}
              >
                {typeLabels[diff.type]}
              </span>
            </div>
            <div className="mt-2 grid gap-3 md:grid-cols-2">
              <ValuePreview value={diff.leftValue} emptyLabel={labels.empty} />
              <ValuePreview value={diff.rightValue} emptyLabel={labels.empty} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

const badgeColors: Record<DiffType, string> = {
  added:
    "bg-emerald-100 text-emerald-900 dark:bg-emerald-500/20 dark:text-emerald-200",
  removed: "bg-rose-100 text-rose-900 dark:bg-rose-500/20 dark:text-rose-200",
  changed:
    "bg-amber-100 text-amber-900 dark:bg-amber-500/20 dark:text-amber-200",
};

type ValuePreviewProps = {
  value: unknown;
  emptyLabel: string;
};

function ValuePreview({ value, emptyLabel }: ValuePreviewProps) {
  const formatted = formatValue(value, emptyLabel);
  return (
    <div
      className={cn(
        "rounded-md border bg-zinc-50/80 p-2 text-sm dark:border-zinc-800 dark:bg-zinc-900/40"
      )}
    >
      <pre className="max-h-48 overflow-auto whitespace-pre-wrap break-all font-mono text-xs text-zinc-900 dark:text-zinc-100">
        {formatted}
      </pre>
    </div>
  );
}

function formatValue(value: unknown, emptyLabel: string) {
  if (value === undefined) {
    return emptyLabel;
  }
  if (typeof value === "string") {
    return value;
  }
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

function formatPath(path: string) {
  return path
    .replace(/^\$\.?/, "")
    .replace(/\./g, " > ")
    .replace(/\[(\d+)\]/g, " > $1")
    .replace(/^ > /, "");
}
