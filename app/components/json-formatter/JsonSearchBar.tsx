"use client";

import { useState } from "react";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useJsonFormatterStore } from "@/lib/stores/jsonFormatterStore";
import { useI18nStore } from "@/lib/stores/i18nStore";
import { t } from "@/lib/i18n";

interface JsonSearchBarProps {
  inputId?: string;
  disabled?: boolean;
}

export function JsonSearchBar({ inputId, disabled = false }: JsonSearchBarProps) {
  const searchQuery = useJsonFormatterStore((state) => state.searchQuery);
  const setSearchQuery = useJsonFormatterStore((state) => state.setSearchQuery);
  const performSearch = useJsonFormatterStore((state) => state.performSearch);
  const clearSearch = useJsonFormatterStore((state) => state.clearSearch);
  const searchResults = useJsonFormatterStore((state) => state.searchResults);
  const performIndividualSearch = useJsonFormatterStore(
    (state) => state.performIndividualSearch
  );
  const clearIndividualSearch = useJsonFormatterStore(
    (state) => state.clearIndividualSearch
  );
  const individualSearchResults = useJsonFormatterStore(
    (state) => state.individualSearchResults
  );
  const language = useI18nStore((state) => state.language);

  // 개별 검색 모드면 해당 inputId의 검색 결과를 사용, 아니면 전체 검색 결과 사용
  const currentSearchResults = inputId
    ? individualSearchResults[inputId] || []
    : searchResults;

  // 개별 검색 모드면 로컬 상태로 관리, 전체 검색 모드면 store의 searchQuery 사용
  const [localQuery, setLocalQuery] = useState("");
  // 검색을 실행했는지 여부 추적
  const [hasSearched, setHasSearched] = useState(false);

  const queryValue = inputId ? localQuery : searchQuery;

  const handleChange = (value: string) => {
    if (inputId) {
      setLocalQuery(value);
    } else {
      setSearchQuery(value);
    }
    if (!value.trim()) {
      setHasSearched(false);
    }
  };

  const handleSearch = () => {
    if (inputId) {
      performIndividualSearch(inputId, queryValue);
    } else {
      performSearch();
    }
    setHasSearched(true);
  };

  const handleClear = () => {
    if (inputId) {
      setLocalQuery("");
      clearIndividualSearch(inputId);
    } else {
      clearSearch();
    }
    setHasSearched(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 size-4 text-gray-400" />
          <Input
            type="text"
            placeholder={t("jsonFormatter.searchBar.placeholder", language)}
            value={queryValue}
            onChange={(e) => handleChange(e.target.value)}
            onKeyDown={handleKeyPress}
            className="pl-9 pr-9"
            disabled={disabled}
          />
          {queryValue && (
            <button
              onClick={handleClear}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              disabled={disabled}
            >
              <X className="size-4" />
            </button>
          )}
        </div>
        <Button onClick={handleSearch} size="default" disabled={disabled}>
          {t("common.search", language)}
        </Button>
      </div>
      {hasSearched && queryValue.trim() && (
        <div className="text-sm text-gray-600 dark:text-gray-400">
          {currentSearchResults.length > 0
            ? language === "ko"
              ? `${currentSearchResults.length}${t("jsonFormatter.searchBar.resultsFound", language)}`
              : `${currentSearchResults.length} ${t("jsonFormatter.searchBar.resultsFound", language)}`
            : t("jsonFormatter.searchBar.noResults", language)}
        </div>
      )}
    </div>
  );
}
