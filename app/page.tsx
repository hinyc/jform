"use client";

import { useEffect } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { JsonFormatArea } from "./components/json-formatter/JsonFormatArea";
import { JsonSearchBar } from "./components/json-formatter/JsonSearchBar";
import { loadJsonFromUrl } from "./components/json-formatter/ShareButton";
import { useJsonFormatterStore } from "@/lib/stores/jsonFormatterStore";

export default function Home() {
  const addJsonObject = useJsonFormatterStore((state) => state.addJsonObject);
  const jsonObjects = useJsonFormatterStore((state) => state.jsonObjects);
  const searchMode = useJsonFormatterStore((state) => state.searchMode);
  const setSearchMode = useJsonFormatterStore((state) => state.setSearchMode);
  const searchResults = useJsonFormatterStore((state) => state.searchResults);

  useEffect(() => {
    const urlData = loadJsonFromUrl();
    if (urlData.length > 0 && jsonObjects.length === 0) {
      urlData.forEach((rawText) => {
        if (rawText.trim()) {
          addJsonObject(rawText);
        }
      });
    }
    // URL 데이터가 없고 jsonObjects가 비어있으면 기본으로 하나 추가
    if (urlData.length === 0 && jsonObjects.length === 0) {
      addJsonObject("");
    }
  }, [addJsonObject, jsonObjects.length]);

  const handleAdd = () => {
    addJsonObject("");
  };

  return (
    <div className="flex min-h-screen bg-zinc-50 font-sans dark:bg-black">
      <main className="flex w-full flex-col gap-6 p-6">
        {/* 헤더 영역: 추가 버튼, 검색 모드 토글, 전체 검색바 */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button onClick={handleAdd} size="sm">
              <Plus className="size-4 mr-1" />
              추가
            </Button>
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

        {/* JsonFormatArea 리스트 */}
        <div className="flex flex-col gap-6">
          {jsonObjects.map((jsonObj) => (
            <JsonFormatArea
              key={jsonObj.id}
              jsonObject={jsonObj}
              searchMode={searchMode}
              globalSearchResults={searchResults}
            />
          ))}
        </div>
      </main>
    </div>
  );
}
