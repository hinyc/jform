'use client';

import { useMemo } from 'react';
import { JsonTreeNode } from './JsonTreeNode';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { SearchResult } from '@/lib/types/jsonFormatter';

interface JsonTreeViewProps {
  inputId: string;
  data: unknown;
  error: string | null;
  searchResults: SearchResult[];
}

// 경로에서 모든 부모 경로를 추출하는 함수
// 예: "user.profile.name" -> ["", "user", "user.profile", "user.profile.name"]
// 예: "items[0].name" -> ["", "items", "items[0]", "items[0].name"]
function getAllParentPaths(path: string): string[] {
  const paths: string[] = [''];
  if (!path) return paths;

  // 정규식으로 경로 파싱: 속성명과 배열 인덱스 분리
  const matches = path.match(/([^.[\]]+|\[[^\]]+\])/g);
  if (!matches) return paths;

  let accumulatedPath = '';
  for (const match of matches) {
    if (match.startsWith('[')) {
      // 배열 인덱스
      accumulatedPath += match;
    } else {
      // 속성명
      if (accumulatedPath) {
        accumulatedPath += '.' + match;
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
}: JsonTreeViewProps) {
  const relevantResults = searchResults.filter((result) => result.inputId === inputId);
  
  const highlightedPaths = useMemo(
    () => new Set(relevantResults.map((r) => r.path)),
    [relevantResults]
  );

  // 검색 결과 경로까지의 모든 부모 경로를 확장 대상으로 추가
  const pathsToExpand = useMemo(() => {
    const expandSet = new Set<string>();
    relevantResults.forEach((result) => {
      const parentPaths = getAllParentPaths(result.path);
      parentPaths.forEach((parentPath) => {
        expandSet.add(parentPath);
      });
    });
    return expandSet;
  }, [relevantResults]);

  if (error) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="text-sm">JSON Parse Error</CardTitle>
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
            유효한 JSON을 입력해주세요
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
            />
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

