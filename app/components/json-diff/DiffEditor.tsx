"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { DiffResult } from "@/lib/utils/compareObjects";
import { findJsonPathInString } from "@/lib/utils/findJsonPathInString";

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
  const leftRef = useRef<HTMLTextAreaElement>(null);
  const rightRef = useRef<HTMLTextAreaElement>(null);

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <EditorField
        label={labels.left}
        value={leftValue}
        onChange={onLeftChange}
        placeholder={placeholders.left}
        activeDiff={activeDiff}
        side="left"
        textareaRef={leftRef}
        otherRef={rightRef}
        otherValue={rightValue}
      />
      <EditorField
        label={labels.right}
        value={rightValue}
        onChange={onRightChange}
        placeholder={placeholders.right}
        activeDiff={activeDiff}
        side="right"
        textareaRef={rightRef}
        otherRef={leftRef}
        otherValue={leftValue}
      />
    </div>
  );
}

type EditorFieldProps = {
  label: string;
  value: string;
  placeholder: string;
  onChange: (value: string) => void;
  activeDiff: DiffResult | null;
  side: "left" | "right";
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
  otherRef: React.RefObject<HTMLTextAreaElement | null>;
  otherValue: string;
};

function EditorField({
  label,
  value,
  placeholder,
  onChange,
  activeDiff,
  side,
  textareaRef,
  otherRef,
  otherValue,
}: EditorFieldProps) {
  useEffect(() => {
    if (!activeDiff || !textareaRef.current) return;

    const targetValue =
      side === "left" ? activeDiff.leftValue : activeDiff.rightValue;
    const otherDiffValue =
      side === "left" ? activeDiff.rightValue : activeDiff.leftValue;

    // 현재 쪽에 값이 없으면 하이라이트하지 않음
    if (targetValue === undefined) return;

    const position = findJsonPathInString(value, activeDiff.path, targetValue);

    if (position) {
      const textarea = textareaRef.current;

      // changed 타입이고 양쪽 모두 값이 있으면 양쪽 다 선택
      if (
        activeDiff.type === "changed" &&
        otherDiffValue !== undefined &&
        otherRef.current
      ) {
        // 우선순위: 오른쪽을 focus, 왼쪽은 선택만
        if (side === "right") {
          textarea.focus();
          textarea.setSelectionRange(position.start, position.end);

          // 왼쪽도 선택
          const otherPosition = findJsonPathInString(
            otherValue,
            activeDiff.path,
            otherDiffValue
          );
          if (otherPosition && otherRef.current) {
            otherRef.current.setSelectionRange(
              otherPosition.start,
              otherPosition.end
            );
            // 왼쪽 스크롤도 조정
            const otherLineHeight =
              parseInt(getComputedStyle(otherRef.current).lineHeight, 10) || 20;
            const otherLinesBeforeSelection =
              otherValue.substring(0, otherPosition.start).split("\n").length -
              1;
            const otherScrollTop =
              otherLinesBeforeSelection * otherLineHeight -
              otherRef.current.clientHeight / 2;
            otherRef.current.scrollTop = Math.max(0, otherScrollTop);
          }
        } else {
          // 왼쪽인 경우 선택만 하고 focus는 안 함
          textarea.setSelectionRange(position.start, position.end);
        }
      } else {
        // added나 removed 타입이거나, 한쪽만 값이 있는 경우
        // 우선순위: 오른쪽 > 왼쪽
        if (
          side === "right" ||
          (side === "left" && otherDiffValue === undefined)
        ) {
          textarea.focus();
        }
        textarea.setSelectionRange(position.start, position.end);
      }

      // 스크롤을 선택된 영역으로 이동
      const lineHeight =
        parseInt(getComputedStyle(textarea).lineHeight, 10) || 20;
      const linesBeforeSelection =
        value.substring(0, position.start).split("\n").length - 1;
      const scrollTop =
        linesBeforeSelection * lineHeight - textarea.clientHeight / 2;
      textarea.scrollTop = Math.max(0, scrollTop);
    }
  }, [activeDiff, value, side, textareaRef, otherRef, otherValue]);

  return (
    <label className="flex flex-col gap-2">
      <span className="text-sm font-semibold text-zinc-600 dark:text-zinc-300">
        {label}
      </span>
      <textarea
        ref={textareaRef}
        spellCheck={false}
        className={cn(
          "max-h-[calc(70vh-10rem)]  min-h-80 w-full rounded-2xl border border-zinc-200 bg-white/90 p-4 font-mono text-sm text-zinc-900 shadow-sm outline-none transition focus:border-black focus:ring-2 focus:ring-black/10 dark:border-zinc-800 dark:bg-zinc-900/80 dark:text-zinc-100 dark:focus:border-white dark:focus:ring-white/10",
          "resize-none"
        )}
        placeholder={placeholder}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}
