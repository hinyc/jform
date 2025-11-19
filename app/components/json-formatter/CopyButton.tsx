"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useJsonFormatterStore } from "@/lib/stores/jsonFormatterStore";
import { useI18nStore } from "@/lib/stores/i18nStore";
import { t } from "@/lib/i18n";

interface CopyButtonProps {
  data: unknown;
  error: string | null;
  isInterface?: boolean;
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

export function CopyButton({ data, error, isInterface = false }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);
  const indentDepth = useJsonFormatterStore((state) => state.indentDepth);
  const language = useI18nStore((state) => state.language);

  const handleCopy = async () => {
    if (error || !data) {
      alert(t("jsonFormatter.copyButton.noValidJson", language));
      return;
    }

    try {
      let textToCopy: string;
      if (isInterface && typeof data === "string") {
        // 인터페이스 문자열인 경우 그대로 복사
        textToCopy = data;
      } else {
        // JSON 데이터인 경우 포맷팅하여 복사
        textToCopy = formatJsonForCopy(data, indentDepth);
      }
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy:", error);
      alert(t("jsonFormatter.copyButton.copyFailed", language));
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
          {t("common.copied", language)}
        </>
      ) : (
        <>
          <Copy className="size-4" />
          {t("common.copy", language)}
        </>
      )}
    </Button>
  );
}
