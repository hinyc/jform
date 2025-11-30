"use client";

/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useRef, useState, useMemo, useCallback } from "react";
import { cn } from "@/lib/utils";
import { DiffResult } from "@/lib/utils/compareObjects";
import { findJsonPathInString } from "@/lib/utils/findJsonPathInString";
import { computeLineDiff } from "@/lib/utils/lineDiff";

import { useDiffStore } from "@/lib/stores/diffStore";

type DiffEditorProps = {
  leftValue: string;
  rightValue: string;
  onLeftChange: (value: string) => void;
  onRightChange: (value: string) => void;
  labels: {
    left: string;
    right: string;
  };
  placeholders: {
    left: string;
    right: string;
  };
  activeDiff: DiffResult | null;
  controlBar?: React.ReactNode;
  searchResults?: {
    leftLines: number[];
    rightLines: number[];
  };
  currentSearchIndex: number;
};

export function DiffEditor({
  leftValue,
  rightValue,
  onLeftChange,
  onRightChange,
  labels,
  placeholders,
  activeDiff,
  controlBar,
  searchResults,
  currentSearchIndex,
}: DiffEditorProps) {
  const { mode, setMode } = useDiffStore();

  return (
    <div className="space-y-4">
      <div className="flex h-12 items-center justify-between gap-4">
        <div className="flex-1">{mode === "view" && controlBar}</div>
        <div className="relative flex items-center rounded-lg border border-zinc-200 bg-zinc-50 p-1 dark:border-zinc-700 dark:bg-zinc-900">
          <button
            onClick={() => setMode("edit")}
            className={cn(
              "relative z-10 rounded-md px-4 py-1.5 text-sm font-medium transition-colors",
              mode === "edit"
                ? "text-white dark:text-zinc-900"
                : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200"
            )}
          >
            Edit
          </button>
          <button
            onClick={() => setMode("view")}
            className={cn(
              "relative z-10 rounded-md px-4 py-1.5 text-sm font-medium transition-colors",
              mode === "view"
                ? "text-white dark:text-zinc-900"
                : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200"
            )}
          >
            View
          </button>
          <span
            className={cn(
              "absolute left-1 top-1 h-[calc(100%-0.5rem)] rounded-md bg-brand-primary-500 transition-all duration-200 ease-out dark:bg-brand-primary-400",
              mode === "edit"
                ? "w-[calc(50%-0.25rem)]"
                : "w-[calc(50%-0.25rem)] translate-x-full"
            )}
          />
        </div>
      </div>

      {mode === "view" ? (
        <AlignedDiffView
          leftValue={leftValue}
          rightValue={rightValue}
          labels={labels}
          activeDiff={activeDiff}
          searchResults={searchResults}
          currentSearchIndex={currentSearchIndex}
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          <EditorField
            label={labels.left}
            value={leftValue}
            onChange={onLeftChange}
            placeholder={placeholders.left}
            activeDiff={activeDiff}
            side="left"
          />
          <EditorField
            label={labels.right}
            value={rightValue}
            onChange={onRightChange}
            placeholder={placeholders.right}
            activeDiff={activeDiff}
            side="right"
          />
        </div>
      )}
    </div>
  );
}

// ... (EditorField implementation remains the same as previous step, omitted for brevity but included in full file)
// Actually, I need to include the full file content to be safe.
// Re-pasting EditorField and adding AlignedDiffView.

type EditorFieldProps = {
  label: string;
  value: string;
  placeholder: string;
  onChange: (value: string) => void;
  activeDiff: DiffResult | null;
  side: "left" | "right";
};

function EditorField({
  label,
  value,
  placeholder,
  onChange,
  activeDiff,
  side,
}: EditorFieldProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const backdropRef = useRef<HTMLPreElement>(null);
  const [highlightRange, setHighlightRange] = useState<{
    start: number;
    end: number;
  } | null>(null);

  const scrollToPosition = useCallback(
    (start: number) => {
      if (textareaRef.current) {
        const textarea = textareaRef.current;
        const lineHeight = 20;
        const linesBeforeSelection =
          value.substring(0, start).split("\n").length - 1;
        const scrollTop =
          linesBeforeSelection * lineHeight - textarea.clientHeight / 2;
        textarea.scrollTop = Math.max(0, scrollTop);
      }
    },
    [value]
  );

  useEffect(() => {
    if (!activeDiff) {
      setHighlightRange(null);
      return;
    }

    const targetValue =
      side === "left" ? activeDiff.leftValue : activeDiff.rightValue;

    const parentPath = getParentPath(activeDiff.path);

    // Handle root path separately
    if (parentPath === "$" && targetValue === undefined) {
      const trimmed = value.trimEnd();
      const lastCharIndex = trimmed.length - 1;
      if (lastCharIndex >= 0) {
        setHighlightRange({
          start: lastCharIndex,
          end: lastCharIndex + 1,
        });
        scrollToPosition(lastCharIndex);
      }
      return;
    }

    if (targetValue !== undefined) {
      const position = findJsonPathInString(
        value,
        activeDiff.path,
        targetValue
      );
      setHighlightRange(position);
      if (position) scrollToPosition(position.start);
      return;
    }

    const parentPosition = findJsonPathInString(value, parentPath);

    if (parentPosition) {
      const closingCharIndex = parentPosition.end - 1;
      setHighlightRange({
        start: closingCharIndex,
        end: parentPosition.end,
      });
      scrollToPosition(closingCharIndex);
    } else {
      setHighlightRange(null);
    }
  }, [activeDiff, value, side, scrollToPosition]);

  const handleScroll = () => {
    if (textareaRef.current && backdropRef.current) {
      backdropRef.current.scrollTop = textareaRef.current.scrollTop;
    }
  };

  const renderHighlight = () => {
    if (!highlightRange) return value;
    const { start, end } = highlightRange;
    if (start < 0 || end > value.length || start > end) return value;

    const before = value.substring(0, start);
    const highlighted = value.substring(start, end);
    const after = value.substring(end);

    return (
      <>
        {before}
        <span className="bg-yellow-200/50 dark:bg-yellow-500/30 rounded-sm">
          {highlighted}
        </span>
        {after}
      </>
    );
  };

  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm font-semibold text-zinc-600 dark:text-zinc-300">
        {label}
      </span>
      <div className="relative w-full rounded-2xl border border-zinc-200 bg-white/90 shadow-sm transition  focus-within:ring-2 focus-within:ring-zinc-300 dark:border-zinc-800 dark:bg-zinc-900/80 dark:focus-within:border-white dark:focus-within:ring-white/10">
        <pre
          ref={backdropRef}
          className={cn(
            "pointer-events-none absolute inset-0 m-0 box-border overflow-y-scroll whitespace-pre-wrap break-all p-4 font-mono text-sm leading-5 text-transparent",
            "max-h-[calc(70vh-10rem)] min-h-80 w-full rounded-2xl",
            "scrollbar-none"
          )}
          aria-hidden="true"
        >
          {renderHighlight()}
          &#8203;
        </pre>
        <textarea
          ref={textareaRef}
          spellCheck={false}
          className={cn(
            "relative block max-h-[calc(70vh-10rem)] min-h-80 w-full resize-none overflow-y-scroll whitespace-pre-wrap break-all rounded-2xl bg-transparent p-4 font-mono text-sm leading-5 text-zinc-900 outline-none dark:text-zinc-100",
            "scrollbar-thin scrollbar-thumb-zinc-200 dark:scrollbar-thumb-zinc-700"
          )}
          placeholder={placeholder}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onScroll={handleScroll}
        />
      </div>
    </div>
  );
}

function getParentPath(path: string) {
  if (path.endsWith("]")) {
    return path.replace(/\[\d+\]$/, "");
  }
  const lastDotIndex = path.lastIndexOf(".");
  if (lastDotIndex > 0) {
    return path.substring(0, lastDotIndex);
  }
  return "$";
}

// --- Aligned View Implementation ---

function tryFormat(value: string) {
  try {
    return JSON.stringify(JSON.parse(value), null, 2);
  } catch {
    return value;
  }
}

function AlignedDiffView({
  leftValue,
  rightValue,
  labels,
  activeDiff,
  searchResults,
  currentSearchIndex,
}: {
  leftValue: string;
  rightValue: string;
  labels: { left: string; right: string };
  activeDiff: DiffResult | null;
  searchResults?: {
    leftLines: number[];
    rightLines: number[];
  };
  currentSearchIndex: number;
}) {
  // Format values for comparison to ensure line diff makes sense
  const formattedLeft = useMemo(() => tryFormat(leftValue), [leftValue]);
  const formattedRight = useMemo(() => tryFormat(rightValue), [rightValue]);

  const { leftLines, rightLines, leftMap, rightMap } = useMemo(
    () => computeLineDiff(formattedLeft, formattedRight),
    [formattedLeft, formattedRight]
  );

  const leftRef = useRef<HTMLDivElement>(null);
  const rightRef = useRef<HTMLDivElement>(null);
  const isScrolling = useRef<"left" | "right" | null>(null);

  // Scroll to active diff
  useEffect(() => {
    if (!activeDiff || !leftRef.current || !rightRef.current) return;

    const targetValue =
      activeDiff.leftValue !== undefined
        ? activeDiff.leftValue
        : activeDiff.rightValue;
    const sourceValue =
      activeDiff.leftValue !== undefined ? formattedLeft : formattedRight;
    const map = activeDiff.leftValue !== undefined ? leftMap : rightMap;

    if (targetValue !== undefined) {
      // We need to find the path in the FORMATTED string, not the raw one
      const position = findJsonPathInString(
        sourceValue,
        activeDiff.path,
        targetValue
      );
      if (position) {
        const originalLineIndex =
          sourceValue.substring(0, position.start).split("\n").length - 1;
        const alignedIndex = map[originalLineIndex];

        if (alignedIndex !== undefined) {
          const lineHeight = 20;
          const scrollTop =
            alignedIndex * lineHeight - leftRef.current.clientHeight / 2;
          leftRef.current.scrollTop = Math.max(0, scrollTop);
          rightRef.current.scrollTop = Math.max(0, scrollTop);
        }
      }
    }
  }, [activeDiff, formattedLeft, formattedRight, leftMap, rightMap]);

  // Scroll to current search result
  useEffect(() => {
    if (!leftRef.current || !rightRef.current || !searchResults) return;

    const leftLines = searchResults.leftLines || [];
    const rightLines = searchResults.rightLines || [];
    const totalSearchResults = leftLines.length + rightLines.length;
    if (totalSearchResults === 0 || currentSearchIndex >= totalSearchResults)
      return;

    // Determine which line to scroll to
    let lineIndex: number;
    if (currentSearchIndex < leftLines.length) {
      // Current result is in left panel
      lineIndex = leftLines[currentSearchIndex];
    } else {
      // Current result is in right panel
      lineIndex = rightLines[currentSearchIndex - leftLines.length];
    }

    if (lineIndex !== undefined) {
      const lineHeight = 20;
      const scrollTop =
        lineIndex * lineHeight - leftRef.current.clientHeight / 2;
      leftRef.current.scrollTop = Math.max(0, scrollTop);
      rightRef.current.scrollTop = Math.max(0, scrollTop);
    }
  }, [currentSearchIndex, searchResults]);

  const handleScroll = (source: "left" | "right") => {
    const current = source === "left" ? leftRef.current : rightRef.current;
    const target = source === "left" ? rightRef.current : leftRef.current;

    if (!current || !target) return;
    if (isScrolling.current && isScrolling.current !== source) return;

    isScrolling.current = source;
    target.scrollTop = current.scrollTop;

    setTimeout(() => {
      isScrolling.current = null;
    }, 50);
  };

  // Helper to check if lines are effectively equal (ignoring comma and whitespace)
  const areLinesEqual = (l1: string, l2: string) => {
    return l1.trim().replace(/,$/, "") === l2.trim().replace(/,$/, "");
  };

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div className="flex flex-col gap-2">
        <span className="text-sm font-semibold text-zinc-600 dark:text-zinc-300">
          {labels.left}
        </span>
        <div
          ref={leftRef}
          onScroll={() => handleScroll("left")}
          className="max-h-[calc(70vh-10rem)] min-h-80 w-full overflow-auto rounded-2xl border border-zinc-200 bg-white p-4 font-mono text-sm leading-5 text-zinc-900 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
        >
          {leftLines.map((line, i) => {
            const rightLine = rightLines[i];
            const isRemoved = line !== null && rightLine === null;
            const isGapForAdded = line === null && rightLine !== null;
            // Check if changed, but ignore comma differences
            const isChanged =
              line !== null &&
              rightLine !== null &&
              !areLinesEqual(line as string, rightLine as string);

            // Check if this line is in search results
            const searchResultIndex =
              searchResults?.leftLines?.indexOf(i) ?? -1;
            const isInSearchResults = searchResultIndex !== -1;
            const isCurrentSearch =
              isInSearchResults && searchResultIndex === currentSearchIndex;

            // Determine if this line has diff highlighting
            const hasDiff = isRemoved || isChanged;

            return (
              <div
                key={i}
                className={cn(
                  "whitespace-pre-wrap break-all min-h-5",
                  // Search result without diff → blue background + blue border
                  isInSearchResults &&
                    !hasDiff &&
                    "bg-brand-primary-500/10 dark:bg-brand-primary-400/10 border-l-4 border-brand-primary-500 dark:border-brand-primary-400",
                  isCurrentSearch &&
                    !hasDiff &&
                    "bg-brand-primary-500/20 dark:bg-brand-primary-400/20",
                  // Diff highlighting (always applied, search or not)
                  isRemoved && "bg-rose-100 dark:bg-rose-900/40", // Removed content
                  isGapForAdded && "bg-emerald-50 dark:bg-emerald-900/20", // Gap for added
                  isChanged && "bg-amber-100 dark:bg-amber-900/40", // Changed content
                  // Current search with diff → stronger background
                  isCurrentSearch &&
                    hasDiff &&
                    isRemoved &&
                    "bg-rose-200 dark:bg-rose-900/60",
                  isCurrentSearch &&
                    hasDiff &&
                    isChanged &&
                    "bg-amber-200 dark:bg-amber-900/60",
                  // Search result with diff → diff-colored border
                  isInSearchResults &&
                    hasDiff &&
                    isRemoved &&
                    "border-l-4 border-rose-500 dark:border-rose-400",
                  isInSearchResults &&
                    hasDiff &&
                    isChanged &&
                    "border-l-4 border-amber-500 dark:border-amber-400"
                )}
              >
                {line === null ? (
                  <span className="select-none text-transparent">.</span>
                ) : (
                  <span>{line}</span>
                )}
              </div>
            );
          })}
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <span className="text-sm font-semibold text-zinc-600 dark:text-zinc-300">
          {labels.right}
        </span>
        <div
          ref={rightRef}
          onScroll={() => handleScroll("right")}
          className="max-h-[calc(70vh-10rem)] min-h-80 w-full overflow-auto rounded-2xl border border-zinc-200 bg-white p-4 font-mono text-sm leading-5 text-zinc-900 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
        >
          {rightLines.map((line, i) => {
            const leftLine = leftLines[i];
            const isAdded = line !== null && leftLine === null;
            const isGapForRemoved = line === null && leftLine !== null;
            // Check if changed, but ignore comma differences
            const isChanged =
              line !== null &&
              leftLine !== null &&
              !areLinesEqual(line as string, leftLine as string);

            // Check if this line is in search results
            const searchLeftLines = searchResults?.leftLines || [];
            const searchRightLines = searchResults?.rightLines || [];
            const searchResultIndex = searchRightLines.indexOf(i);
            const isInSearchResults = searchResultIndex !== -1;
            const isCurrentSearch =
              isInSearchResults &&
              searchResultIndex + searchLeftLines.length === currentSearchIndex;

            // Determine if this line has diff highlighting
            const hasDiff = isAdded || isChanged;

            return (
              <div
                key={i}
                className={cn(
                  "whitespace-pre-wrap break-all min-h-5",
                  // Search result without diff → blue background + blue border
                  isInSearchResults &&
                    !hasDiff &&
                    "bg-brand-primary-500/10 dark:bg-brand-primary-400/10 border-l-4 border-brand-primary-500 dark:border-brand-primary-400",
                  isCurrentSearch &&
                    !hasDiff &&
                    "bg-brand-primary-500/20 dark:bg-brand-primary-400/20",
                  // Diff highlighting (always applied, search or not)
                  isAdded && "bg-emerald-100 dark:bg-emerald-900/40", // Added content
                  isGapForRemoved && "bg-rose-50 dark:bg-rose-900/20", // Gap for removed
                  isChanged && "bg-amber-100 dark:bg-amber-900/40", // Changed content
                  // Current search with diff → stronger background
                  isCurrentSearch &&
                    hasDiff &&
                    isAdded &&
                    "bg-emerald-200 dark:bg-emerald-900/60",
                  isCurrentSearch &&
                    hasDiff &&
                    isChanged &&
                    "bg-amber-200 dark:bg-amber-900/60",
                  // Search result with diff → diff-colored border
                  isInSearchResults &&
                    hasDiff &&
                    isAdded &&
                    "border-l-4 border-emerald-500 dark:border-emerald-400",
                  isInSearchResults &&
                    hasDiff &&
                    isChanged &&
                    "border-l-4 border-amber-500 dark:border-amber-400"
                )}
              >
                {line === null ? (
                  <span className="select-none text-transparent">.</span>
                ) : (
                  <span>{line}</span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
