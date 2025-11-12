"use client";

import { JsonInputCard } from "./JsonInputCard";
import { JsonTreeView } from "./JsonTreeView";
import { JsonSearchBar } from "./JsonSearchBar";
import { CopyButton } from "./CopyButton";
import { Card, CardContent } from "@/components/ui/card";
import { useJsonFormatterStore } from "@/lib/stores/jsonFormatterStore";
import { useI18nStore } from "@/lib/stores/i18nStore";
import { t } from "@/lib/i18n";
import type { JsonInput, SearchResult } from "@/lib/types/jsonFormatter";

interface JsonFormatAreaProps {
  jsonObject: JsonInput;
  searchMode: "global" | "individual";
  globalSearchResults?: SearchResult[];
}

export function JsonFormatArea({
  jsonObject,
  searchMode,
  globalSearchResults = [],
}: JsonFormatAreaProps) {
  const removeJsonObject = useJsonFormatterStore(
    (state) => state.removeJsonObject
  );
  const jsonObjects = useJsonFormatterStore((state) => state.jsonObjects);
  const individualSearchResults = useJsonFormatterStore(
    (state) => state.individualSearchResults
  );
  const language = useI18nStore((state) => state.language);

  const handleRemove = () => {
    removeJsonObject(jsonObject.id);
  };

  // 최소 하나의 JsonFormatArea가 있을 때는 삭제 버튼 숨김
  const canRemove = jsonObjects.length > 1;

  // 검색 결과 결정: 개별 검색 모드면 individualSearchResults, 전체 검색 모드면 globalSearchResults
  const searchResults =
    searchMode === "individual"
      ? individualSearchResults[jsonObject.id] || []
      : globalSearchResults;

  return (
    <Card className="w-full" style={{ minHeight: "256px" }}>
      <CardContent className="px-4 py-2">
        <div className="flex flex-row gap-6 w-full">
          {/* 좌측: JSON 입력 영역 */}
          <div style={{ minWidth: "200px", maxWidth: "40vw", width: "40%" }}>
            <div className="h-full flex flex-col">
              <JsonInputCard
                id={jsonObject.id}
                initialValue={jsonObject.rawText}
                onRemove={canRemove ? handleRemove : undefined}
              />
            </div>
          </div>

          {/* 우측: JSON 결과 영역 */}
          <div style={{ minWidth: "400px", maxWidth: "60vw", width: "60%" }}>
            <div className="h-full w-full flex flex-col">
              {/* 개별 검색 모드일 때만 검색바 표시 */}
              {searchMode === "individual" && (
                <div className="flex mb-4 gap-4 h-12 items-center justify-between">
                  <h2 className="text-lg font-semibold shrink-0">
                    {t("jsonFormatter.formatArea.resultTitle", language)}
                  </h2>
                  <div className="flex items-center gap-2 flex-1 justify-end">
                    <div className="w-[60%]">
                      <JsonSearchBar inputId={jsonObject.id} />
                    </div>
                    <CopyButton
                      data={jsonObject.parsedData}
                      error={jsonObject.error}
                    />
                  </div>
                </div>
              )}
              {searchMode === "global" && (
                <div className="flex mb-4 gap-4 h-12 items-center justify-between">
                  <h2 className="text-lg font-semibold shrink-0">
                    {t("jsonFormatter.formatArea.resultTitle", language)}
                  </h2>
                  <CopyButton
                    data={jsonObject.parsedData}
                    error={jsonObject.error}
                  />
                </div>
              )}
              <div className="flex-1" style={{ minHeight: "200px" }}>
                <JsonTreeView
                  inputId={jsonObject.id}
                  data={jsonObject.parsedData}
                  error={jsonObject.error}
                  searchResults={searchResults}
                />
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
