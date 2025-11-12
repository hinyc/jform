import type { Language } from "./stores/i18nStore";
import koMessages from "../messages/ko.json";
import enMessages from "../messages/en.json";

type Messages = typeof koMessages;

const messages: Record<Language, Messages> = {
  ko: koMessages,
  en: enMessages,
};

/**
 * 번역 함수
 * @param key - 번역 키 (점 표기법, 예: "common.add")
 * @param lang - 언어
 * @returns 번역된 문자열
 */
export function t(key: string, lang: Language): string {
  const keys = key.split(".");
  let value: unknown = messages[lang];

  for (const k of keys) {
    if (value && typeof value === "object" && value !== null && k in value) {
      value = (value as Record<string, unknown>)[k];
    } else {
      // 키를 찾을 수 없으면 키 자체를 반환
      return key;
    }
  }

  return typeof value === "string" ? value : key;
}
