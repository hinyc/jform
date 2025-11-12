import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Language = "ko" | "en";

interface I18nState {
  language: Language;
  setLanguage: (lang: Language) => void;
  detectDefaultLanguage: () => Language;
}

const STORAGE_KEY = "jform-language";

// 기본 언어 감지: 한국 접속 시 ko, 그 외 en
function detectDefaultLanguage(): Language {
  if (typeof window === "undefined") return "en";

  // localStorage에 저장된 언어가 있으면 사용
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved === "ko" || saved === "en") {
    return saved;
  }

  // 브라우저 언어 설정 확인
  const browserLang = navigator.language || (navigator as any).userLanguage;
  if (browserLang.startsWith("ko")) {
    return "ko";
  }

  // 기본값은 영어
  return "en";
}

export const useI18nStore = create<I18nState>()(
  persist(
    (set, get) => ({
      language: "en", // 기본값, persist가 localStorage에서 복원함
      setLanguage: (lang: Language) => {
        set({ language: lang });
        if (typeof window !== "undefined") {
          // html lang 속성 업데이트
          document.documentElement.lang = lang;
        }
      },
      detectDefaultLanguage,
    }),
    {
      name: STORAGE_KEY,
      // localStorage에 값이 없을 때만 기본 언어 감지
      onRehydrateStorage: () => (state) => {
        if (state && typeof window !== "undefined") {
          // localStorage에 저장된 값이 없으면 기본 언어 감지
          const saved = localStorage.getItem(STORAGE_KEY);
          if (!saved) {
            const detected = detectDefaultLanguage();
            state.setLanguage(detected);
          } else {
            // 저장된 언어로 html lang 속성 업데이트
            document.documentElement.lang = state.language;
          }
        }
      },
    }
  )
);

