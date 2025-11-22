"use client";

import { useState, useRef, useLayoutEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { useJsonFormatterStore } from "@/lib/stores/jsonFormatterStore";
import { useI18nStore } from "@/lib/stores/i18nStore";
import { t } from "@/lib/i18n";

interface JsonInputCardProps {
  id: string;
  initialValue?: string;
  onRemove?: () => void;
}

export function JsonInputCard({ id, initialValue = "" }: JsonInputCardProps) {
  const [localValue, setLocalValue] = useState(initialValue);
  const updateJsonObject = useJsonFormatterStore(
    (state) => state.updateJsonObject
  );
  const prevInitialValueRef = useRef(initialValue);
  const isUserEditingRef = useRef(false);
  const language = useI18nStore((state) => state.language);

  // initialValue가 변경되었을 때만 로컬 상태 동기화 (사용자가 편집 중이 아닐 때만)
  // 외부 prop 변경 시 내부 상태 동기화는 정당한 사용 사례입니다
  useLayoutEffect(() => {
    if (
      prevInitialValueRef.current !== initialValue &&
      !isUserEditingRef.current
    ) {
      prevInitialValueRef.current = initialValue;
      // 외부 prop 변경에 따른 상태 동기화 (비동기로 처리하여 렌더링 중 상태 변경 방지)
      Promise.resolve().then(() => {
        setLocalValue(initialValue);
      });
    }
  }, [initialValue]);

  const handleChange = (value: string) => {
    isUserEditingRef.current = true;
    setLocalValue(value);
    updateJsonObject(id, value);
    // 편집 후 짧은 시간 후에 플래그 리셋
    setTimeout(() => {
      isUserEditingRef.current = false;
    }, 1000);
  };

  return (
    <Card className="h-full flex flex-col p-0">
      <CardContent className="flex-1 h-full p-[2px] overflow-hidden">
        <textarea
          value={localValue}
          onChange={(e) => handleChange(e.target.value)}
          placeholder={t("jsonFormatter.inputCard.placeholder", language)}
          className="w-full h-full resize-none  rounded-lg px-3 py-6 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-zinc-300 dark:bg-gray-900 dark:border-gray-700 dark:text-gray-100 overflow-x-auto"
        />
      </CardContent>
    </Card>
  );
}
