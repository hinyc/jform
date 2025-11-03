"use client";

import { useState } from "react";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useJsonFormatterStore } from "@/lib/stores/jsonFormatterStore";

export function JsonSearchBar() {
  const searchQuery = useJsonFormatterStore((state) => state.searchQuery);
  const setSearchQuery = useJsonFormatterStore((state) => state.setSearchQuery);
  const performSearch = useJsonFormatterStore((state) => state.performSearch);
  const clearSearch = useJsonFormatterStore((state) => state.clearSearch);
  const searchResults = useJsonFormatterStore((state) => state.searchResults);

  const [localQuery, setLocalQuery] = useState(searchQuery);

  const handleSearch = () => {
    setSearchQuery(localQuery);
    performSearch();
  };

  const handleClear = () => {
    setLocalQuery("");
    clearSearch();
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
          />
          {localQuery && (
            <button
              onClick={handleClear}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X className="size-4" />
            </button>
          )}
        </div>
        <Button onClick={handleSearch} size="default">
          검색
        </Button>
      </div>
      {searchResults.length > 0 && (
        <div className="text-sm text-gray-600 dark:text-gray-400">
          {searchResults.length}개의 결과를 찾았습니다
        </div>
      )}
    </div>
  );
}
