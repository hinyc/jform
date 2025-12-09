"use client";

import { useEffect, useRef } from "react";
import { JsonFormatArea } from "./components/json-formatter/JsonFormatArea";
import { JsonFormatterHeader } from "./components/json-formatter/JsonFormatterHeader";
import { loadJsonFromUrl } from "./components/json-formatter/ShareButton";
import { useJsonFormatterStore } from "@/lib/stores/jsonFormatterStore";

export default function Home() {
  const addJsonObject = useJsonFormatterStore((state) => state.addJsonObject);
  const jsonObjects = useJsonFormatterStore((state) => state.jsonObjects);
  const searchMode = useJsonFormatterStore((state) => state.searchMode);
  const searchResults = useJsonFormatterStore((state) => state.searchResults);
  const currentGlobalSearchInputId = useJsonFormatterStore(
    (state) => state.currentGlobalSearchInputId
  );
  const areaRefs = useRef<Record<string, HTMLDivElement | null>>({});

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

  // 전체 검색 모드에서 여러 JsonFormatArea 간 이동 처리
  const currentGlobalSearchIndex = useJsonFormatterStore(
    (state) => state.currentGlobalSearchIndex
  );

  useEffect(() => {
    if (
      searchMode === "global" &&
      currentGlobalSearchInputId &&
      areaRefs.current[currentGlobalSearchInputId]
    ) {
      // JsonFormatArea로 스크롤
      const areaElement = areaRefs.current[currentGlobalSearchInputId];
      if (areaElement) {
        areaElement.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }
    }
  }, [searchMode, currentGlobalSearchInputId, currentGlobalSearchIndex]);

  return (
    <div className="flex min-h-screen bg-zinc-50 font-sans dark:bg-black pt-18">
      <main className="flex w-full flex-col gap-6 p-6">
        {/* 헤더 영역: 추가 버튼, 검색 모드 토글, 전체 검색바 */}
        <JsonFormatterHeader />

        {/* JsonFormatArea 리스트 */}
        <div className="flex flex-col gap-6">
          {jsonObjects.map((jsonObj) => (
            <div
              key={jsonObj.id}
              ref={(el) => {
                areaRefs.current[jsonObj.id] = el;
              }}
            >
              <JsonFormatArea
                jsonObject={jsonObj}
                searchMode={searchMode}
                globalSearchResults={searchResults}
              />
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
