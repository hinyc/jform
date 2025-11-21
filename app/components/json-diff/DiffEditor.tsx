"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import { DiffResult } from "@/lib/utils/compareObjects";
import { findJsonPathInString } from "@/lib/utils/findJsonPathInString";
import { computeLineDiff } from "@/lib/utils/lineDiff";

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
};

export function DiffEditor({
  leftValue,
  rightValue,
  onLeftChange,
  onRightChange,
  labels,
  placeholders,
  activeDiff,
}: DiffEditorProps) {
  const [mode, setMode] = useState<"view" | "edit">("view");

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <div className="flex rounded-lg border border-zinc-200 bg-white p-1 dark:border-zinc-800 dark:bg-zinc-900">
          <button
            onClick={() => setMode("view")}
            className={cn(
              "rounded-md px-3 py-1 text-sm font-medium transition-colors",
              mode === "view"
                ? "bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100"
                : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
            )}
          >
            View
          </button>
          <button
            onClick={() => setMode("edit")}
            className={cn(
              "rounded-md px-3 py-1 text-sm font-medium transition-colors",
              mode === "edit"
                ? "bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100"
                : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
            )}
          >
            Edit
          </button>
        </div>
      </div>

      {mode === "view" ? (
        <AlignedDiffView
          leftValue={leftValue}
          rightValue={rightValue}
          labels={labels}
          activeDiff={activeDiff}
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
      const position = findJsonPathInString(value, activeDiff.path, targetValue);
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

  }, [activeDiff, value, side]);

  const scrollToPosition = (start: number) => {
    if (textareaRef.current) {
      const textarea = textareaRef.current;
      const lineHeight = 20;
      const linesBeforeSelection =
        value.substring(0, start).split("\n").length - 1;
      const scrollTop =
        linesBeforeSelection * lineHeight - textarea.clientHeight / 2;
      textarea.scrollTop = Math.max(0, scrollTop);
    }
  };

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
      <div className="relative w-full rounded-2xl border border-zinc-200 bg-white/90 shadow-sm transition focus-within:border-black focus-within:ring-2 focus-within:ring-black/10 dark:border-zinc-800 dark:bg-zinc-900/80 dark:focus-within:border-white dark:focus-within:ring-white/10">
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
}: {
  leftValue: string;
  rightValue: string;
  labels: { left: string; right: string };
  activeDiff: DiffResult | null;
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

    const targetValue = activeDiff.leftValue !== undefined ? activeDiff.leftValue : activeDiff.rightValue;
    const sourceValue = activeDiff.leftValue !== undefined ? formattedLeft : formattedRight;
    const map = activeDiff.leftValue !== undefined ? leftMap : rightMap;

    if (targetValue !== undefined) {
       // We need to find the path in the FORMATTED string, not the raw one
       const position = findJsonPathInString(sourceValue, activeDiff.path, targetValue);
       if (position) {
         const originalLineIndex = sourceValue.substring(0, position.start).split("\n").length - 1;
         const alignedIndex = map[originalLineIndex];
         
         if (alignedIndex !== undefined) {
           const lineHeight = 20;
           const scrollTop = alignedIndex * lineHeight - leftRef.current.clientHeight / 2;
           leftRef.current.scrollTop = Math.max(0, scrollTop);
           rightRef.current.scrollTop = Math.max(0, scrollTop);
         }
       }
    }
  }, [activeDiff, formattedLeft, formattedRight, leftMap, rightMap]);

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
            const isChanged = line !== null && rightLine !== null && !areLinesEqual(line, rightLine);
            
            return (
              <div 
                key={i} 
                className={cn(
                  "whitespace-pre-wrap break-all min-h-[1.25rem]",
                  isRemoved && "bg-rose-100 dark:bg-rose-900/40", // Removed content
                  isGapForAdded && "bg-emerald-50 dark:bg-emerald-900/20", // Gap for added
                  isChanged && "bg-amber-100 dark:bg-amber-900/40" // Changed content
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
            const isChanged = line !== null && leftLine !== null && !areLinesEqual(line, leftLine);

            return (
              <div 
                key={i} 
                className={cn(
                  "whitespace-pre-wrap break-all min-h-[1.25rem]",
                  isAdded && "bg-emerald-100 dark:bg-emerald-900/40", // Added content
                  isGapForRemoved && "bg-rose-50 dark:bg-rose-900/20", // Gap for removed
                  isChanged && "bg-amber-100 dark:bg-amber-900/40" // Changed content
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
