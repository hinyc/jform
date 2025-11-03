'use client';

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

export function JsonTreeView({
  inputId,
  data,
  error,
  searchResults,
}: JsonTreeViewProps) {
  const highlightedPaths = new Set(
    searchResults.filter((result) => result.inputId === inputId).map((r) => r.path)
  );

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
          <div className="font-mono text-sm">
            <JsonTreeNode
              keyName={null}
              value={data}
              depth={0}
              path=""
              highlightedPaths={highlightedPaths}
            />
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

