"use client";

import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { JsonSearchBar } from "./JsonSearchBar";
import { useJsonFormatterStore } from "@/lib/stores/jsonFormatterStore";

export function JsonFormatterHeader() {
  const addJsonObject = useJsonFormatterStore((state) => state.addJsonObject);
  const searchMode = useJsonFormatterStore((state) => state.searchMode);
  const setSearchMode = useJsonFormatterStore((state) => state.setSearchMode);
  const indentDepth = useJsonFormatterStore((state) => state.indentDepth);
  const setIndentDepth = useJsonFormatterStore((state) => state.setIndentDepth);

  const handleAdd = () => {
    addJsonObject("");
  };

  const handleIndentDepthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === "") {
      return;
    }
    const numValue = parseInt(value, 10);
    if (!isNaN(numValue)) {
      setIndentDepth(numValue);
    }
  };

  return (
    <div className="sticky top-18 z-40 bg-zinc-50 dark:bg-black pb-4 pt-6 -mt-6 -mx-6 px-6 border-b border-gray-200 dark:border-gray-800">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button onClick={handleAdd} size="sm">
            <Plus className="size-4 mr-1" />
            추가
          </Button>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              들여쓰기:
            </span>
            <Input
              type="number"
              min="1"
              max="8"
              value={indentDepth}
              onChange={handleIndentDepthChange}
              className="w-16 h-8 text-center"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              검색 모드:
            </span>
            <div className="flex gap-1 border rounded-md p-1">
              <Button
                variant={searchMode === "global" ? "default" : "ghost"}
                size="sm"
                onClick={() => setSearchMode("global")}
                className="h-7 px-3"
              >
                전체검색
              </Button>
              <Button
                variant={searchMode === "individual" ? "default" : "ghost"}
                size="sm"
                onClick={() => setSearchMode("individual")}
                className="h-7 px-3"
              >
                개별검색
              </Button>
            </div>
          </div>
        </div>
        {searchMode === "global" && (
          <div className="flex-1 max-w-md">
            <JsonSearchBar />
          </div>
        )}
        {searchMode === "individual" && (
          <div className="flex-1 max-w-md">
            <JsonSearchBar disabled={true} />
          </div>
        )}
      </div>
    </div>
  );
}
