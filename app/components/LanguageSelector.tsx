"use client";

import { useState, useRef, useEffect } from "react";
import { Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useI18nStore } from "@/lib/stores/i18nStore";
import { t } from "@/lib/i18n";
import type { Language } from "@/lib/stores/i18nStore";

export function LanguageSelector() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const language = useI18nStore((state) => state.language);
  const setLanguage = useI18nStore((state) => state.setLanguage);

  const languages: Language[] = ["ko", "en"];

  const getLanguageLabel = (code: Language): string => {
    return t(`languages.${code}`, language);
  };

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const handleLanguageChange = (lang: Language) => {
    setLanguage(lang);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <Button
        onClick={() => setIsOpen(!isOpen)}
        variant="outline"
        size="sm"
        className="gap-2"
      >
        <Globe className="size-4" />
        <span className="hidden sm:inline">{getLanguageLabel(language)}</span>
        <span className="sm:hidden">{language.toUpperCase()}</span>
      </Button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-40 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg z-50">
          <div className="py-1">
            {languages.map((langCode) => (
              <button
                key={langCode}
                onClick={() => handleLanguageChange(langCode)}
                className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
                  language === langCode
                    ? "bg-gray-100 dark:bg-gray-700 font-medium"
                    : ""
                }`}
              >
                {getLanguageLabel(langCode)}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
