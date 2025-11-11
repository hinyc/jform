"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useJsonFormatterStore } from "@/lib/stores/jsonFormatterStore";

interface CopyButtonProps {
  data: unknown;
  error: string | null;
}

/**
 * JSON 데이터를 모두 펼쳐진 상태로 포맷팅하는 함수
 * 들여쓰기를 유지하여 포맷팅
 */
function formatJsonForCopy(data: unknown, indentDepth: number): string {
  if (data === null || data === undefined) {
    return "null";
  }

  try {
    return JSON.stringify(data, null, indentDepth);
  } catch (error) {
    console.error("JSON stringify error:", error);
    return String(data);
  }
}

export function CopyButton({ data, error }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);
  const indentDepth = useJsonFormatterStore((state) => state.indentDepth);

  const handleCopy = async () => {
    if (error || !data) {
      alert("복사할 수 있는 유효한 JSON이 없습니다.");
      return;
    }

    try {
      const formattedJson = formatJsonForCopy(data, indentDepth);
      await navigator.clipboard.writeText(formattedJson);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy:", error);
      alert("복사에 실패했습니다.");
    }
  };

  return (
    <Button
      onClick={handleCopy}
      variant="outline"
      size="sm"
      disabled={!!error || !data}
      className="shrink-0"
    >
      {copied ? (
        <>
          <Check className="size-4" />
          복사됨
        </>
      ) : (
        <>
          <Copy className="size-4" />
          복사
        </>
      )}
    </Button>
  );
}
