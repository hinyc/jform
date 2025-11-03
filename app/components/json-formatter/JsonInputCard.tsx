"use client";

import { useState, useRef, useLayoutEffect } from "react";
import { Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useJsonFormatterStore } from "@/lib/stores/jsonFormatterStore";

interface JsonInputCardProps {
  id: string;
  initialValue?: string;
  onRemove?: () => void;
}

export function JsonInputCard({
  id,
  initialValue = "",
  onRemove,
}: JsonInputCardProps) {
  const [localValue, setLocalValue] = useState(initialValue);
  const updateJsonObject = useJsonFormatterStore(
    (state) => state.updateJsonObject
  );
  const prevInitialValueRef = useRef(initialValue);
  const isUserEditingRef = useRef(false);

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

  const handleRemove = () => {
    if (onRemove) {
      onRemove();
    }
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">JSON Input</CardTitle>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={handleRemove}
          className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
        >
          <Trash2 className="size-4" />
        </Button>
      </CardHeader>
      <CardContent className="flex-1 p-4 pt-0 overflow-hidden">
        <textarea
          value={localValue}
          onChange={(e) => handleChange(e.target.value)}
          placeholder='예: { "name": "John", "age": 30 }'
          className="w-full h-full resize-none border rounded-md p-3 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-900 dark:border-gray-700 dark:text-gray-100 overflow-x-auto"
        />
      </CardContent>
    </Card>
  );
}
