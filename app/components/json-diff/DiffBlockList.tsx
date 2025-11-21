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
    path: string;
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
              "cursor-pointer rounded-2xl border p-4 transition-shadow dark:border-zinc-800",
              isActive
                ? "border-black/60 shadow-lg dark:border-white/70"
                : "border-zinc-200 shadow-sm hover:border-black/30 dark:hover:border-white/50"
            )}
            onClick={() => onSelect(index)}
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="text-sm font-semibold text-zinc-700 dark:text-zinc-200">
                {labels.path}:{" "}
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
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              <ValuePreview
                label={labels.left}
                value={diff.leftValue}
                isActive={isActive}
                emptyLabel={labels.empty}
              />
              <ValuePreview
                label={labels.right}
                value={diff.rightValue}
                isActive={isActive}
                emptyLabel={labels.empty}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

const badgeColors: Record<DiffType, string> = {
  added: "bg-emerald-100 text-emerald-900 dark:bg-emerald-500/20 dark:text-emerald-200",
  removed:
    "bg-rose-100 text-rose-900 dark:bg-rose-500/20 dark:text-rose-200",
  changed:
    "bg-amber-100 text-amber-900 dark:bg-amber-500/20 dark:text-amber-200",
};

type ValuePreviewProps = {
  label: string;
  value: unknown;
  emptyLabel: string;
  isActive: boolean;
};

function ValuePreview({
  label,
  value,
  emptyLabel,
  isActive,
}: ValuePreviewProps) {
  const formatted = formatValue(value, emptyLabel);
  return (
    <div
      className={cn(
        "rounded-xl border bg-zinc-50/80 p-3 text-sm dark:border-zinc-800 dark:bg-zinc-900/40",
        isActive && "border-black/70 dark:border-white/70"
      )}
    >
      <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
        {label}
      </div>
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
    .replace(/^\$\.?/, "root")
    .replace(/\./g, " > ")
    .replace(/\[(\d+)\]/g, " > $1");
}
