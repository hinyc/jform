"use client";

/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useMemo, useRef, useState } from "react";
import { DiffEditor } from "./DiffEditor";
import { DiffControlBar } from "./DiffControlBar";
import { DiffBlockList } from "./DiffBlockList";
import { useI18nStore } from "@/lib/stores/i18nStore";
import { t } from "@/lib/i18n";
import { useDiffStore } from "@/lib/stores/diffStore";
import { compareObjects } from "@/lib/utils/compareObjects";
import { computeLineDiff } from "@/lib/utils/lineDiff";

export type SearchResult = {
  lineIndex: number;
  sides: ("left" | "right")[];
};

export function DiffViewer() {
  const language = useI18nStore((state) => state.language);
  const { leftValue, rightValue, setLeftValue, setRightValue, mode } =
    useDiffStore();
  const [selectedIndex, setSelectedIndex] = useState(0);
  const blockRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [currentSearchIndex, setCurrentSearchIndex] = useState(0);

  const canCompare =
    leftValue.trim().length > 0 && rightValue.trim().length > 0;

  const { diffs, error } = useMemo(() => {
    if (!canCompare) {
      return { diffs: [], error: undefined as string | undefined };
    }
    try {
      const left = JSON.parse(leftValue);
      const right = JSON.parse(rightValue);
      return { diffs: compareObjects(left, right), error: undefined };
    } catch {
      return { diffs: [], error: t("jsonDiff.errors.invalid", language) };
    }
  }, [canCompare, leftValue, rightValue, language]);

  const diffCount = diffs.length;
  const activeIndex =
    diffCount === 0 ? -1 : Math.min(selectedIndex, diffCount - 1);

  useEffect(() => {
    if (activeIndex < 0) return;
    const target = blockRefs.current[activeIndex];
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [activeIndex]);

  const handlePrev = () => {
    if (!diffCount) return;
    setSelectedIndex((prev) => {
      const safe = Math.min(prev, diffCount - 1);
      return (safe - 1 + diffCount) % diffCount;
    });
  };

  const handleNext = () => {
    if (!diffCount) return;
    setSelectedIndex((prev) => {
      const safe = Math.min(prev, diffCount - 1);
      return (safe + 1) % diffCount;
    });
  };

  // Search handlers
  const totalSearchResults = searchResults.length;

  const handleSearchPrev = () => {
    if (totalSearchResults === 0) return;
    setCurrentSearchIndex(
      (prev) => (prev - 1 + totalSearchResults) % totalSearchResults
    );
  };

  const handleSearchNext = () => {
    if (totalSearchResults === 0) return;
    setCurrentSearchIndex((prev) => (prev + 1) % totalSearchResults);
  };

  // Perform search when query or values change
  useEffect(() => {
    if (!searchQuery.trim() || !canCompare) {
      setSearchResults([]);
      setCurrentSearchIndex(0);
      return;
    }

    try {
      // Format values
      const formattedLeft = JSON.stringify(JSON.parse(leftValue), null, 2);
      const formattedRight = JSON.stringify(JSON.parse(rightValue), null, 2);

      // Compute line diff to get alignment maps
      const { leftMap, rightMap } = computeLineDiff(
        formattedLeft,
        formattedRight
      );

      const leftLinesArr = formattedLeft.split("\n");
      const rightLinesArr = formattedRight.split("\n");

      const query = searchQuery.toLowerCase();
      const leftMatches: number[] = [];
      const rightMatches: number[] = [];

      // Search in left panel (original line indices)
      leftLinesArr.forEach((line, index) => {
        if (line.toLowerCase().includes(query)) {
          leftMatches.push(index);
        }
      });

      // Search in right panel (original line indices)
      rightLinesArr.forEach((line, index) => {
        if (line.toLowerCase().includes(query)) {
          rightMatches.push(index);
        }
      });

      // Convert original indices to aligned indices
      const alignedLeftMatches = leftMatches
        .map((idx) => leftMap[idx])
        .filter((idx) => idx !== undefined) as number[];

      const alignedRightMatches = rightMatches
        .map((idx) => rightMap[idx])
        .filter((idx) => idx !== undefined) as number[];

      // Merge results: deduplicate same-line matches
      const mergedResults: SearchResult[] = [];
      const processedLines = new Set<number>();

      // Process left matches
      alignedLeftMatches.forEach((lineIdx) => {
        if (!processedLines.has(lineIdx)) {
          const isInRight = alignedRightMatches.includes(lineIdx);
          mergedResults.push({
            lineIndex: lineIdx,
            sides: isInRight ? ["left", "right"] : ["left"],
          });
          processedLines.add(lineIdx);
        }
      });

      // Process right matches (only those not already processed)
      alignedRightMatches.forEach((lineIdx) => {
        if (!processedLines.has(lineIdx)) {
          mergedResults.push({
            lineIndex: lineIdx,
            sides: ["right"],
          });
          processedLines.add(lineIdx);
        }
      });

      // Sort by line index
      mergedResults.sort((a, b) => a.lineIndex - b.lineIndex);

      setSearchResults(mergedResults);
      setCurrentSearchIndex(0);
    } catch {
      // Invalid JSON, clear results
      setSearchResults([]);
      setCurrentSearchIndex(0);
    }
  }, [searchQuery, leftValue, rightValue, canCompare]);

  const editorLabels = {
    left: t("jsonDiff.inputs.leftLabel", language),
    right: t("jsonDiff.inputs.rightLabel", language),
  };

  const placeholders = {
    left: t("jsonDiff.inputs.leftPlaceholder", language),
    right: t("jsonDiff.inputs.rightPlaceholder", language),
  };

  const blockLabels = {
    left: t("jsonDiff.blocks.left", language),
    right: t("jsonDiff.blocks.right", language),
    empty: t("jsonDiff.blocks.empty", language),
  };

  const typeLabels = {
    added: t("jsonDiff.types.added", language),
    removed: t("jsonDiff.types.removed", language),
    changed: t("jsonDiff.types.changed", language),
  };

  const hints = {
    prev: t("jsonDiff.hints.prev", language),
    next: t("jsonDiff.hints.next", language),
  };

  const diffSummary = `${t("jsonDiff.status.differences", language)}`;
  const sameLabel = t("jsonDiff.status.same", language);

  // Convert SearchResult[] to the format expected by DiffControlBar
  const searchResultsForControlBar = useMemo(() => {
    const leftLines: number[] = [];
    const rightLines: number[] = [];

    searchResults.forEach((result) => {
      if (result.sides.includes("left")) {
        leftLines.push(result.lineIndex);
      }
      if (result.sides.includes("right")) {
        rightLines.push(result.lineIndex);
      }
    });

    return { leftLines, rightLines };
  }, [searchResults]);

  return (
    <section className="mx-auto flex w-full max-w-6xl flex-col gap-6 pb-6">
      <div className="sticky top-18 z-10 flex flex-col gap-4 bg-zinc-50/95 pb-4 backdrop-blur-sm dark:bg-black/95">
        <DiffEditor
          leftValue={leftValue}
          rightValue={rightValue}
          onLeftChange={setLeftValue}
          onRightChange={setRightValue}
          labels={editorLabels}
          placeholders={placeholders}
          activeDiff={activeIndex >= 0 ? diffs[activeIndex] : null}
          searchResults={searchResultsForControlBar}
          currentSearchIndex={currentSearchIndex}
          controlBar={
            <DiffControlBar
              total={diffCount}
              currentIndex={Math.max(activeIndex, 0)}
              onPrev={handlePrev}
              onNext={handleNext}
              activeLabel={diffSummary}
              sameLabel={sameLabel}
              hints={hints}
              canCompare={canCompare && !error}
              mode={mode}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              searchResults={searchResultsForControlBar}
              onSearchResults={() => {
                // Convert back to SearchResult[] format if needed
                // For now, we'll just ignore this since we manage searchResults in DiffViewer
              }}
              currentSearchIndex={currentSearchIndex}
              onSearchPrev={handleSearchPrev}
              onSearchNext={handleSearchNext}
            />
          }
        />
      </div>
      {!canCompare && (
        <p className="rounded-xl border border-dashed border-zinc-300 bg-white/70 p-4 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:bg-zinc-900/60 dark:text-zinc-400">
          {t("jsonDiff.status.empty", language)}
        </p>
      )}
      {error && (
        <p className="rounded-xl border border-rose-200 bg-rose-50/80 p-4 text-sm font-semibold text-rose-700 dark:border-rose-500/40 dark:bg-rose-500/10 dark:text-rose-200">
          {error}
        </p>
      )}
      {!error && canCompare && (
        <DiffBlockList
          diffs={diffs}
          activeIndex={activeIndex}
          onSelect={setSelectedIndex}
          blockRefs={blockRefs}
          labels={blockLabels}
          typeLabels={typeLabels}
        />
      )}
    </section>
  );
}
