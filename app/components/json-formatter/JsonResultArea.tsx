"use client";

import { JsonTreeView } from "./JsonTreeView";
import { JsonSearchBar } from "./JsonSearchBar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useJsonFormatterStore } from "@/lib/stores/jsonFormatterStore";

export function JsonResultArea() {
  const jsonObjects = useJsonFormatterStore((state) => state.jsonObjects);
  const searchResults = useJsonFormatterStore((state) => state.searchResults);

  return (
    <div className="h-full w-full flex flex-col ">
      <div className="flex mb-4 gap-4 h-12 items-center justify-between">
        <h2 className="text-lg font-semibold shrink-0">JSON 결과</h2>
        <div className="w-[60%]">
          <JsonSearchBar />
        </div>
      </div>

      <ScrollArea className="flex-1 w-full overflow-x-auto ">
        <div className="space-y-4 pr-4 ">
          {jsonObjects.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center border-2 border-dashed rounded-lg border-gray-300 dark:border-gray-700">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                왼쪽에서 JSON을 입력하면 결과가 여기 표시됩니다
              </p>
            </div>
          ) : (
            jsonObjects.map((jsonObj) => (
              <div key={jsonObj.id} className="h-64">
                <JsonTreeView
                  inputId={jsonObj.id}
                  data={jsonObj.parsedData}
                  error={jsonObj.error}
                  searchResults={searchResults}
                />
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
