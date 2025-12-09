"use client";

import { useMemo, useRef, useEffect } from "react";
import { JsonTreeNode } from "./JsonTreeNode";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useJsonFormatterStore } from "@/lib/stores/jsonFormatterStore";
import { useI18nStore } from "@/lib/stores/i18nStore";
import { t } from "@/lib/i18n";
import type { SearchResult } from "@/lib/types/jsonFormatter";

interface JsonTreeViewProps {
  inputId: string;
  data: unknown;
  error: string | null;
  searchResults: SearchResult[];
  currentSearchIndex?: number;
  expandAll?: boolean;
  currentGlobalSearchInputId?: string | null;
}

// 경로에서 모든 부모 경로를 추출하는 함수
// 예: "user.profile.name" -> ["", "user", "user.profile", "user.profile.name"]
// 예: "items[0].name" -> ["", "items", "items[0]", "items[0].name"]
function getAllParentPaths(path: string): string[] {
  const paths: string[] = [""];
  if (!path) return paths;

  // 정규식으로 경로 파싱: 속성명과 배열 인덱스 분리
  const matches = path.match(/([^.[\]]+|\[[^\]]+\])/g);
  if (!matches) return paths;

  let accumulatedPath = "";
  for (const match of matches) {
    if (match.startsWith("[")) {
      // 배열 인덱스
      accumulatedPath += match;
    } else {
      // 속성명
      if (accumulatedPath) {
        accumulatedPath += "." + match;
      } else {
        accumulatedPath = match;
      }
    }
    paths.push(accumulatedPath);
  }

  return paths;
}

export function JsonTreeView({
  inputId,
  data,
  error,
  searchResults,
  currentSearchIndex = -1,
  expandAll,
  currentGlobalSearchInputId,
}: JsonTreeViewProps) {
  const indentDepth = useJsonFormatterStore((state) => state.indentDepth);
  const language = useI18nStore((state) => state.language);
  const relevantResults = searchResults.filter(
    (result) => result.inputId === inputId
  );
  const currentNodeRef = useRef<HTMLDivElement>(null);

  const highlightedPaths = useMemo(
    () => new Set(relevantResults.map((r) => r.path)),
    [relevantResults]
  );

  // 검색 결과 경로까지의 모든 부모 경로 + 검색 결과 경로 자체를 확장 대상으로 추가
  const pathsToExpand = useMemo(() => {
    const expandSet = new Set<string>();
    relevantResults.forEach((result) => {
      // 검색 결과 경로 자체도 추가 (object/array인 경우 확장되도록)
      expandSet.add(result.path);
      // 부모 경로들도 추가
      const parentPaths = getAllParentPaths(result.path);
      parentPaths.forEach((parentPath) => {
        expandSet.add(parentPath);
      });
    });
    return expandSet;
  }, [relevantResults]);

  // 현재 검색 인덱스에 해당하는 결과로 스크롤
  useEffect(() => {
    if (
      currentSearchIndex >= 0 &&
      currentSearchIndex < relevantResults.length
    ) {
      // 전체 검색 모드에서 다른 JsonFormatArea로 이동한 경우 더 긴 지연 필요
      const isGlobalSearchMode =
        currentGlobalSearchInputId !== undefined &&
        currentGlobalSearchInputId === inputId;
      const initialDelay = isGlobalSearchMode ? 500 : 200;

      // DOM 업데이트 후 스크롤이 확실히 동작하도록 약간의 지연 추가
      const timeoutId = setTimeout(() => {
        const scrollToNode = (attempt: number = 0): boolean => {
          if (!currentNodeRef.current) {
            if (attempt < 5) {
              // 최대 5번까지 재시도
              setTimeout(() => scrollToNode(attempt + 1), 150);
            }
            return false;
          }

          // ScrollArea 내부에서 스크롤이 동작하도록 처리
          const scrollContainer = currentNodeRef.current?.closest(
            '[data-slot="scroll-area-viewport"]'
          ) as HTMLElement;

          if (!scrollContainer) {
            // ScrollArea를 찾을 수 없으면 기본 scrollIntoView 사용
            if (currentNodeRef.current) {
              currentNodeRef.current.scrollIntoView({
                behavior: "smooth",
                block: "center",
              });
            }
            return true;
          }

          // 노드가 실제로 렌더링되었는지 확인
          const nodeRect = currentNodeRef.current.getBoundingClientRect();
          if (nodeRect.width === 0 && nodeRect.height === 0) {
            // 노드가 아직 렌더링되지 않음, 재시도
            if (attempt < 5) {
              setTimeout(() => scrollToNode(attempt + 1), 150);
            }
            return false;
          }

          const containerRect = scrollContainer.getBoundingClientRect();
          const currentScrollTop = scrollContainer.scrollTop;

          // 노드가 스크롤 컨테이너 내에서 어디에 있는지 계산
          const nodeTopInContainer =
            nodeRect.top - containerRect.top + currentScrollTop;
          const containerHeight = scrollContainer.clientHeight;
          const nodeHeight = nodeRect.height;

          // 노드를 컨테이너 중앙에 위치시키기 위한 스크롤 위치 계산
          const targetScrollTop =
            nodeTopInContainer - containerHeight / 2 + nodeHeight / 2;

          scrollContainer.scrollTo({
            top: Math.max(0, targetScrollTop),
            behavior: "smooth",
          });
          return true;
        };

        // 첫 시도
        scrollToNode(0);
      }, initialDelay);

      return () => clearTimeout(timeoutId);
    }
  }, [
    currentSearchIndex,
    relevantResults.length,
    currentGlobalSearchInputId,
    inputId,
  ]);

  if (error) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="text-sm">
            {t("jsonFormatter.treeView.parseError", language)}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-red-600 dark:text-red-400 font-mono">
            {error}
          </p>
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return (
      <Card className="h-full">
        <CardContent className="flex items-center justify-center h-full py-8">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {t("jsonFormatter.treeView.enterValidJson", language)}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full flex flex-col">
      <CardContent className="flex-1 p-4 overflow-hidden">
        <ScrollArea className="h-full w-full">
          <div className="font-mono text-sm overflow-x-auto">
            <JsonTreeNode
              keyName={null}
              value={data}
              depth={0}
              path=""
              highlightedPaths={highlightedPaths}
              searchResults={relevantResults}
              inputId={inputId}
              pathsToExpand={pathsToExpand}
              indentDepth={indentDepth}
              currentSearchIndex={currentSearchIndex}
              nodeRef={currentNodeRef}
              expandAll={expandAll}
            />
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
