"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { DiffEditor } from "./DiffEditor";
import { DiffControlBar } from "./DiffControlBar";
import { DiffBlockList } from "./DiffBlockList";
import { useI18nStore } from "@/lib/stores/i18nStore";
import { t } from "@/lib/i18n";
import { useDiffStore } from "@/lib/stores/diffStore";
import { compareObjects } from "@/lib/utils/compareObjects";

export function DiffViewer() {
  const language = useI18nStore((state) => state.language);
  const { leftValue, rightValue, setLeftValue, setRightValue } = useDiffStore();
  const [selectedIndex, setSelectedIndex] = useState(0);
  const blockRefs = useRef<(HTMLDivElement | null)[]>([]);

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
