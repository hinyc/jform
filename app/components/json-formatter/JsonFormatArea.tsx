"use client";

import { useState, useMemo } from "react";
import { JsonInputCard } from "./JsonInputCard";
import { JsonTreeView } from "./JsonTreeView";
import { JsonSearchBar } from "./JsonSearchBar";
import { CopyButton } from "./CopyButton";
import { TypeScriptInterfaceView } from "./TypeScriptInterfaceView";
import { PythonInterfaceView } from "./PythonInterfaceView";
import { Card, CardContent } from "@/components/ui/card";
import { useJsonFormatterStore } from "@/lib/stores/jsonFormatterStore";
import { useI18nStore } from "@/lib/stores/i18nStore";
import { t } from "@/lib/i18n";
import type { JsonInput, SearchResult } from "@/lib/types/jsonFormatter";
import { Button } from "@/components/ui/button";
import { Trash2, ChevronsDownUp, ChevronsUpDown } from "lucide-react";

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
  const [viewType, setViewType] = useState<"json" | "interface">("json");
  const [interfaceLanguage, setInterfaceLanguage] = useState<
    "typescript" | "python"
  >("typescript");
  const [isExpanded, setIsExpanded] = useState(false);
  const removeJsonObject = useJsonFormatterStore(
    (state) => state.removeJsonObject
  );
  const jsonObjects = useJsonFormatterStore((state) => state.jsonObjects);
  const individualSearchResults = useJsonFormatterStore(
    (state) => state.individualSearchResults
  );
  const typescriptInterfaces = useJsonFormatterStore(
    (state) => state.typescriptInterfaces
  );
  const pythonInterfaces = useJsonFormatterStore(
    (state) => state.pythonInterfaces
  );
  const generateTypeScriptInterface = useJsonFormatterStore(
    (state) => state.generateTypeScriptInterface
  );
  const generatePythonInterface = useJsonFormatterStore(
    (state) => state.generatePythonInterface
  );
  const currentGlobalSearchIndex = useJsonFormatterStore(
    (state) => state.currentGlobalSearchIndex
  );
  const currentGlobalSearchInputId = useJsonFormatterStore(
    (state) => state.currentGlobalSearchInputId
  );
  const currentIndividualSearchIndex = useJsonFormatterStore(
    (state) => state.currentIndividualSearchIndex
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

  // 현재 검색 인덱스 결정
  // 전체 검색 모드: 현재 포커스된 JsonFormatArea이고, 전체 검색 결과에서 현재 인덱스에 해당하는 결과가 이 JsonFormatArea에 속하는 경우
  // 개별 검색 모드: 해당 JsonFormatArea의 개별 검색 인덱스
  const currentSearchIndex = useMemo(() => {
    if (searchMode === "individual") {
      return currentIndividualSearchIndex[jsonObject.id] ?? -1;
    } else {
      // 전체 검색 모드
      // currentGlobalSearchInputId와 currentGlobalSearchIndex가 모두 유효한 경우에만 계산
      if (
        currentGlobalSearchInputId === jsonObject.id &&
        currentGlobalSearchIndex >= 0 &&
        currentGlobalSearchIndex < globalSearchResults.length
      ) {
        // 전체 검색 결과에서 현재 인덱스에 해당하는 결과
        const currentGlobalResult =
          globalSearchResults[currentGlobalSearchIndex];
        if (
          currentGlobalResult &&
          currentGlobalResult.inputId === jsonObject.id
        ) {
          // 이 JsonFormatArea의 검색 결과 중에서 해당 결과의 인덱스 찾기
          const relevantResults = globalSearchResults.filter(
            (result) => result.inputId === jsonObject.id
          );
          const localIndex = relevantResults.findIndex(
            (result) => result.path === currentGlobalResult.path
          );
          return localIndex >= 0 ? localIndex : -1;
        }
      }
      return -1;
    }
  }, [
    searchMode,
    currentIndividualSearchIndex,
    jsonObject.id,
    currentGlobalSearchInputId,
    currentGlobalSearchIndex,
    globalSearchResults,
  ]);

  // 뷰 타입 변경
  const handleViewTypeChange = (type: "json" | "interface") => {
    setViewType(type);
    if (type === "interface") {
      // 인터페이스 선택 시 현재 선택된 언어로 생성
      if (interfaceLanguage === "typescript") {
        generateTypeScriptInterface(jsonObject.id);
      } else {
        generatePythonInterface(jsonObject.id);
      }
    }
  };

  // 인터페이스 언어 변경
  const handleInterfaceLanguageChange = (lang: "typescript" | "python") => {
    setInterfaceLanguage(lang);
    if (lang === "typescript") {
      generateTypeScriptInterface(jsonObject.id);
    } else {
      generatePythonInterface(jsonObject.id);
    }
  };

  // 실제 활성 뷰 계산
  const activeView =
    viewType === "json"
      ? "json"
      : interfaceLanguage === "typescript"
      ? "typescript"
      : "python";

  const typescriptInterfaceData = typescriptInterfaces[jsonObject.id];
  const pythonInterfaceData = pythonInterfaces[jsonObject.id];

  return (
    <Card className="w-full gap-0" style={{ minHeight: "256px" }}>
      {/* 통합 Sticky 헤더: 좌측 입력 영역 헤더 + 우측 결과 영역 헤더 */}
      <div className="sticky top-[150px] z-30 bg-card/95 backdrop-blur-sm border-b border-gray-200 dark:border-gray-800 px-4 py-2">
        <div className="flex flex-row gap-6 w-full items-center">
          {/* 좌측 헤더: JSON 입력 타이틀 */}
          <div
            className="flex items-center h-10"
            style={{ minWidth: "200px", maxWidth: "40vw", width: "40%" }}
          >
            <h2 className="text-lg font-semibold shrink-0">
              {t("jsonFormatter.inputCard.title", language)}
            </h2>
          </div>

          {/* 우측 헤더: 뷰 컨트롤 및 액션 버튼 */}
          <div
            className="flex items-center justify-between h-10"
            style={{ minWidth: "400px", maxWidth: "60vw", width: "60%" }}
          >
            <div className="flex items-center gap-2">
              {/* 탭 버튼: JSON | 구조/인터페이스 */}
              <div className="flex gap-1 border rounded-md p-1">
                <Button
                  variant={viewType === "json" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => handleViewTypeChange("json")}
                  className="h-7 px-3 w-16"
                >
                  {t("jsonFormatter.formatArea.jsonTab", language)}
                </Button>
                <Button
                  variant={viewType === "interface" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => handleViewTypeChange("interface")}
                  className="h-7 px-3"
                >
                  {t("jsonFormatter.formatArea.interfaceTab", language)}
                </Button>
              </div>
              {/* 전체 펼치기/닫기 토글 버튼 - JSON 뷰일 때만 표시 */}
              {activeView === "json" && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="h-7 px-2"
                  title={
                    isExpanded
                      ? t("jsonFormatter.formatArea.collapseAll", language)
                      : t("jsonFormatter.formatArea.expandAll", language)
                  }
                >
                  {isExpanded ? (
                    <ChevronsUpDown className="size-4" />
                  ) : (
                    <ChevronsDownUp className="size-4" />
                  )}
                </Button>
              )}
              {/* 구조/인터페이스 선택 시 언어 드롭다운 */}
              {viewType === "interface" && (
                <select
                  value={interfaceLanguage}
                  onChange={(e) =>
                    handleInterfaceLanguageChange(
                      e.target.value as "typescript" | "python"
                    )
                  }
                  className="h-8 px-3 text-sm border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <option value="typescript">
                    {t("jsonFormatter.formatArea.typescriptTab", language)}
                  </option>
                  <option value="python">
                    {t("jsonFormatter.formatArea.pythonTab", language)}
                  </option>
                </select>
              )}
            </div>

            <div className="flex items-center gap-2 flex-1 justify-end">
              {searchMode === "individual" && activeView === "json" && (
                <div className="w-[60%]">
                  <JsonSearchBar inputId={jsonObject.id} />
                </div>
              )}
              {activeView === "json" ? (
                <CopyButton
                  data={jsonObject.parsedData}
                  error={jsonObject.error}
                />
              ) : activeView === "typescript" ? (
                <CopyButton
                  data={typescriptInterfaceData?.interfaceString || null}
                  error={typescriptInterfaceData?.error || null}
                  isInterface={true}
                />
              ) : (
                <CopyButton
                  data={pythonInterfaceData?.interfaceString || null}
                  error={pythonInterfaceData?.error || null}
                  isInterface={true}
                />
              )}
              {canRemove && (
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={handleRemove}
                  className="text-brand-error-500 hover:text-brand-error-600 dark:text-brand-error-400 dark:hover:text-brand-error-300 cursor-pointer ml-1"
                >
                  <Trash2 className="size-4" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 콘텐츠 영역 */}
      <CardContent className="px-4 py-4">
        <div className="flex flex-row gap-6 w-full">
          {/* 좌측: JSON 입력 영역 */}
          <div style={{ minWidth: "200px", maxWidth: "40vw", width: "40%" }}>
            <div className="h-full w-full flex flex-col">
              <div className="flex-1" style={{ minHeight: "200px" }}>
                <JsonInputCard
                  id={jsonObject.id}
                  initialValue={jsonObject.rawText}
                />
              </div>
            </div>
          </div>

          {/* 우측: JSON 결과 영역 */}
          <div style={{ minWidth: "400px", maxWidth: "60vw", width: "60%" }}>
            <div className="h-full w-full flex flex-col">
              <div className="flex-1" style={{ minHeight: "200px" }}>
                {activeView === "json" ? (
                  <JsonTreeView
                    inputId={jsonObject.id}
                    data={jsonObject.parsedData}
                    error={jsonObject.error}
                    searchResults={searchResults}
                    currentSearchIndex={currentSearchIndex}
                    expandAll={isExpanded}
                    currentGlobalSearchInputId={
                      searchMode === "global"
                        ? currentGlobalSearchInputId
                        : undefined
                    }
                  />
                ) : activeView === "typescript" ? (
                  <TypeScriptInterfaceView inputId={jsonObject.id} />
                ) : (
                  <PythonInterfaceView inputId={jsonObject.id} />
                )}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
