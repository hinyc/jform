"use client";

import { useState } from "react";
import { Search, X, ChevronUp, ChevronDown } from "lucide-react";
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
  const currentGlobalSearchIndex = useJsonFormatterStore(
    (state) => state.currentGlobalSearchIndex
  );
  const currentIndividualSearchIndex = useJsonFormatterStore(
    (state) => state.currentIndividualSearchIndex
  );
  const moveToNextGlobalSearchResult = useJsonFormatterStore(
    (state) => state.moveToNextGlobalSearchResult
  );
  const moveToPrevGlobalSearchResult = useJsonFormatterStore(
    (state) => state.moveToPrevGlobalSearchResult
  );
  const moveToNextIndividualSearchResult = useJsonFormatterStore(
    (state) => state.moveToNextIndividualSearchResult
  );
  const moveToPrevIndividualSearchResult = useJsonFormatterStore(
    (state) => state.moveToPrevIndividualSearchResult
  );
  const language = useI18nStore((state) => state.language);

  // 개별 검색 모드면 해당 inputId의 검색 결과를 사용, 아니면 전체 검색 결과 사용
  const currentSearchResults = inputId
    ? individualSearchResults[inputId] || []
    : searchResults;

  // 현재 검색 인덱스
  const currentSearchIndex = inputId
    ? currentIndividualSearchIndex[inputId] ?? 0
    : currentGlobalSearchIndex;

  // 개별 검색 모드면 로컬 상태로 관리, 전체 검색 모드면 store의 searchQuery 사용
  const [localQuery, setLocalQuery] = useState("");
  // 검색을 실행했는지 여부 추적
  const [hasSearched, setHasSearched] = useState(false);
  // 이전 검색 쿼리 추적 (엔터 키 처리용)
  const [prevQuery, setPrevQuery] = useState("");

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
    setPrevQuery(queryValue);
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
      const currentValue = e.currentTarget.value.trim();
      // 검색 쿼리가 변경되지 않고 검색 결과가 있으면 다음 결과로 이동
      if (currentValue === prevQuery && currentSearchResults.length > 0) {
        e.preventDefault();
        if (inputId) {
          moveToNextIndividualSearchResult(inputId);
        } else {
          moveToNextGlobalSearchResult();
        }
      } else {
        // 검색 쿼리가 변경되면 새 검색 수행
        handleSearch();
      }
    }
  };

  const handleSearchPrev = () => {
    if (currentSearchResults.length === 0) return;
    if (inputId) {
      moveToPrevIndividualSearchResult(inputId);
    } else {
      moveToPrevGlobalSearchResult();
    }
  };

  const handleSearchNext = () => {
    if (currentSearchResults.length === 0) return;
    if (inputId) {
      moveToNextIndividualSearchResult(inputId);
    } else {
      moveToNextGlobalSearchResult();
    }
  };

  const totalSearchResults = currentSearchResults.length;
  const showNavigation = hasSearched && queryValue.trim() && totalSearchResults > 0;

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
        <div className="flex items-center gap-2">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {totalSearchResults > 0
              ? language === "ko"
                ? `${totalSearchResults}${t("jsonFormatter.searchBar.resultsFound", language)}`
                : `${totalSearchResults} ${t("jsonFormatter.searchBar.resultsFound", language)}`
              : t("jsonFormatter.searchBar.noResults", language)}
          </div>
          {showNavigation && (
            <>
              <span className="text-sm font-semibold text-zinc-500 dark:text-zinc-400">
                <span className="inline-block w-8 text-right">
                  {currentSearchIndex + 1}
                </span>
                &nbsp;/ {totalSearchResults}
              </span>
              <div className="flex items-center">
                <Button
                  type="button"
                  size="icon-sm"
                  variant="ghost"
                  onClick={handleSearchPrev}
                  aria-label="Previous search result"
                  disabled={disabled}
                >
                  <ChevronUp className="size-6 text-zinc-500 dark:text-zinc-400" />
                </Button>
                <Button
                  type="button"
                  size="icon-sm"
                  variant="ghost"
                  onClick={handleSearchNext}
                  aria-label="Next search result"
                  disabled={disabled}
                >
                  <ChevronDown className="size-6 text-zinc-500 dark:text-zinc-400" />
                </Button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
