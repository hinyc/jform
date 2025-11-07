"use client";

import { useState, useEffect } from "react";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useJsonFormatterStore } from "@/lib/stores/jsonFormatterStore";

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

  // 개별 검색 모드면 해당 inputId의 검색 결과를 사용, 아니면 전체 검색 결과 사용
  const currentSearchResults = inputId
    ? individualSearchResults[inputId] || []
    : searchResults;

  // 개별 검색 모드면 로컬 상태로 관리, 전체 검색 모드면 store의 searchQuery 사용
  const [localQuery, setLocalQuery] = useState(
    inputId ? "" : searchQuery
  );

  // 전체 검색 모드일 때 searchQuery 변경 시 로컬 상태 동기화
  useEffect(() => {
    if (!inputId) {
      setLocalQuery(searchQuery);
    }
  }, [searchQuery, inputId]);

  const handleSearch = () => {
    if (inputId) {
      // 개별 검색
      performIndividualSearch(inputId, localQuery);
    } else {
      // 전체 검색
      setSearchQuery(localQuery);
      performSearch();
    }
  };

  const handleClear = () => {
    setLocalQuery("");
    if (inputId) {
      clearIndividualSearch(inputId);
    } else {
      clearSearch();
    }
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
            placeholder="키나 값을 검색하세요..."
            value={localQuery}
            onChange={(e) => setLocalQuery(e.target.value)}
            onKeyDown={handleKeyPress}
            className="pl-9 pr-9"
            disabled={disabled}
          />
          {localQuery && (
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
          검색
        </Button>
      </div>
      {currentSearchResults.length > 0 && (
        <div className="text-sm text-gray-600 dark:text-gray-400">
          {currentSearchResults.length}개의 결과를 찾았습니다
        </div>
      )}
    </div>
  );
}
