"use client";

import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { JsonInputCard } from "./JsonInputCard";
import { useJsonFormatterStore } from "@/lib/stores/jsonFormatterStore";

export function JsonInputArea() {
  const jsonObjects = useJsonFormatterStore((state) => state.jsonObjects);
  const addJsonObject = useJsonFormatterStore((state) => state.addJsonObject);
  const removeJsonObject = useJsonFormatterStore(
    (state) => state.removeJsonObject
  );

  const handleAdd = () => {
    addJsonObject("");
  };

  const handleRemove = (id: string) => {
    removeJsonObject(id);
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-4 h-12">
        <h2 className="text-lg font-semibold">JSON 입력</h2>
        <Button onClick={handleAdd} size="sm">
          <Plus className="size-4 mr-1" />
          추가
        </Button>
      </div>
      <ScrollArea className="flex-1">
        <div className="space-y-4 pr-4">
          {jsonObjects.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center border-2 border-dashed rounded-lg border-gray-300 dark:border-gray-700">
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                JSON 객체를 추가해주세요
              </p>
              <Button onClick={handleAdd} size="sm">
                <Plus className="size-4 mr-1" />첫 번째 JSON 추가
              </Button>
            </div>
          ) : (
            jsonObjects.map((jsonObj) => (
              <div key={jsonObj.id} className="h-64">
                <JsonInputCard
                  id={jsonObj.id}
                  initialValue={jsonObj.rawText}
                  onRemove={() => handleRemove(jsonObj.id)}
                />
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
