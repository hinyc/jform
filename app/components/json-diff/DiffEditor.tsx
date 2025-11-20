"use client";

import { cn } from "@/lib/utils";

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
};

export function DiffEditor({
  leftValue,
  rightValue,
  onLeftChange,
  onRightChange,
  labels,
  placeholders,
}: DiffEditorProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <EditorField
        label={labels.left}
        value={leftValue}
        onChange={onLeftChange}
        placeholder={placeholders.left}
      />
      <EditorField
        label={labels.right}
        value={rightValue}
        onChange={onRightChange}
        placeholder={placeholders.right}
      />
    </div>
  );
}

type EditorFieldProps = {
  label: string;
  value: string;
  placeholder: string;
  onChange: (value: string) => void;
};

function EditorField({
  label,
  value,
  placeholder,
  onChange,
}: EditorFieldProps) {
  return (
    <label className="flex flex-col gap-2">
      <span className="text-sm font-semibold text-zinc-600 dark:text-zinc-300">
        {label}
      </span>
      <textarea
        spellCheck={false}
        className={cn(
          "h-80 w-full rounded-2xl border border-zinc-200 bg-white/90 p-4 font-mono text-sm text-zinc-900 shadow-sm outline-none transition focus:border-black focus:ring-2 focus:ring-black/10 dark:border-zinc-800 dark:bg-zinc-900/80 dark:text-zinc-100 dark:focus:border-white dark:focus:ring-white/10",
          "resize-none"
        )}
        placeholder={placeholder}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}


