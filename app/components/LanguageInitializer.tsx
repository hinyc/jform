"use client";

import { useEffect } from "react";
import { useI18nStore } from "@/lib/stores/i18nStore";

/**
 * 초기 마운트 시 언어를 감지하고 html lang 속성을 설정하는 컴포넌트
 */
export function LanguageInitializer() {
  const language = useI18nStore((state) => state.language);

  useEffect(() => {
    // html lang 속성 업데이트
    document.documentElement.lang = language;
  }, [language]);

  return null;
}

