"use client";

import { useState, useEffect, useRef } from "react";
import { ChevronRight, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SearchResult } from "@/lib/types/jsonFormatter";

interface JsonTreeNodeProps {
  keyName: string | number | null;
  value: unknown;
  depth: number;
  path: string;
  highlightedPaths?: Set<string>;
  searchResults?: SearchResult[];
  inputId?: string;
  pathsToExpand?: Set<string>;
}

function formatValue(value: unknown): string {
  if (value === null) return "null";
  if (value === undefined) return "undefined";
  if (typeof value === "string") return `"${value}"`;
  if (typeof value === "number" || typeof value === "boolean")
    return String(value);
  if (Array.isArray(value)) return `[${value.length}]`;
  if (typeof value === "object") {
    const keys = Object.keys(value);
    return `{${keys.length}}`;
  }
  return String(value);
}

function getValueType(value: unknown): "object" | "array" | "primitive" {
  if (value === null || value === undefined) return "primitive";
  if (Array.isArray(value)) return "array";
  if (typeof value === "object") return "object";
  return "primitive";
}

export function JsonTreeNode({
  keyName,
  value,
  depth,
  path,
  highlightedPaths = new Set(),
  searchResults = [],
  inputId = "",
  pathsToExpand = new Set(),
}: JsonTreeNodeProps) {
  const valueType = getValueType(value);
  const isExpandable = valueType === "object" || valueType === "array";
  // 뎁스당 스페이스 2개로 들여쓰기
  const indentSpaces = "  ".repeat(depth);

  // 검색 결과에서 현재 경로에 해당하는 결과 찾기
  const currentSearchResult = searchResults.find(
    (result) => result.inputId === inputId && result.path === path
  );
  const isKeyHighlighted = currentSearchResult?.matchedField === "key";
  const isValueHighlighted = currentSearchResult?.matchedField === "value";

  // 초기 렌더링 시 확장해야 하는 경로인지 확인
  const shouldExpandInitially = pathsToExpand.has(path) && isExpandable;
  const [isExpanded, setIsExpanded] = useState(
    shouldExpandInitially || depth < 2
  );

  // 검색 결과가 있을 때만 한 번 자동 확장 (사용자 조작은 이후 자유롭게)
  const prevPathsToExpandRef = useRef<Set<string>>(new Set());
  useEffect(() => {
    // pathsToExpand가 새로 추가되었을 때만 확장
    const wasInPrevious = prevPathsToExpandRef.current.has(path);
    const isInCurrent = pathsToExpand.has(path);

    if (!wasInPrevious && isInCurrent && isExpandable && !isExpanded) {
      setIsExpanded(true);
    }

    prevPathsToExpandRef.current = new Set(pathsToExpand);
  }, [pathsToExpand, path, isExpandable, isExpanded]);

  const toggleExpand = () => {
    if (isExpandable) {
      setIsExpanded(!isExpanded);
    }
  };

  const renderKey = () => {
    if (keyName === null) return null;
    const keyDisplay =
      typeof keyName === "number" ? `[${keyName}]` : `"${keyName}"`;
    return (
      <span
        className={cn(
          "text-blue-600 dark:text-blue-400 font-medium",
          isKeyHighlighted && "bg-yellow-200 dark:bg-yellow-800 rounded px-1"
        )}
      >
        {keyDisplay}
      </span>
    );
  };

  const renderPrimitive = () => {
    const formatted = formatValue(value);
    const valueClass =
      typeof value === "string"
        ? "text-green-600 dark:text-green-400"
        : typeof value === "number"
        ? "text-purple-600 dark:text-purple-400"
        : typeof value === "boolean"
        ? "text-orange-600 dark:text-orange-400"
        : "text-gray-500 dark:text-gray-400";

    return (
      <span
        className={cn(
          valueClass,
          isValueHighlighted && "bg-yellow-200 dark:bg-yellow-800 rounded px-1"
        )}
      >
        {formatted}
      </span>
    );
  };

  const renderExpandableContent = () => {
    if (!isExpanded) {
      const preview = formatValue(value);
      return (
        <span className="text-gray-500 dark:text-gray-400 italic">
          {preview}
        </span>
      );
    }

    if (valueType === "object" && value !== null && typeof value === "object") {
      const entries = Object.entries(value);
      return (
        <>
          {entries.map(([key, val]) => {
            const childPath = path ? `${path}.${key}` : key;
            return (
              <JsonTreeNode
                key={key}
                keyName={key}
                value={val}
                depth={depth + 2}
                path={childPath}
                highlightedPaths={highlightedPaths}
                searchResults={searchResults}
                inputId={inputId}
                pathsToExpand={pathsToExpand}
              />
            );
          })}
        </>
      );
    }

    if (valueType === "array" && Array.isArray(value)) {
      return (
        <>
          {value.map((item, index) => {
            const childPath = `${path}[${index}]`;
            return (
              <JsonTreeNode
                key={index}
                keyName={index}
                value={item}
                depth={depth + 2}
                path={childPath}
                highlightedPaths={highlightedPaths}
                searchResults={searchResults}
                inputId={inputId}
                pathsToExpand={pathsToExpand}
              />
            );
          })}
        </>
      );
    }

    return null;
  };

  // Primitive value - single line
  if (!isExpandable) {
    return (
      <div className="flex items-start gap-1 py-0.5">
        <span className="select-none whitespace-pre font-mono text-transparent">
          {indentSpaces}
        </span>
        <div className="w-4 shrink-0" />
        <div className="flex items-start gap-1 flex-1 min-w-0">
          {keyName !== null && (
            <>
              {renderKey()}
              <span className="text-gray-500 dark:text-gray-400">:</span>
              <span className="w-2" />
            </>
          )}
          {renderPrimitive()}
        </div>
      </div>
    );
  }

  // Expandable object/array
  const openBracket = valueType === "object" ? "{" : "[";
  const closeBracket = valueType === "object" ? "}" : "]";

  if (!isExpanded) {
    // Collapsed view - single line
    return (
      <div className="flex items-start gap-1 py-0.5">
        <span className="select-none whitespace-pre font-mono text-transparent">
          {indentSpaces}
        </span>
        <button
          onClick={toggleExpand}
          className="shrink-0 mt-0.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded p-0.5 transition-colors"
          aria-label="Expand"
        >
          <ChevronRight className="size-4 text-gray-600 dark:text-gray-400" />
        </button>
        <div className="flex items-start gap-1 flex-1 min-w-0">
          {keyName !== null && (
            <>
              {renderKey()}
              <span className="text-gray-500 dark:text-gray-400">:</span>
              <span className="w-2" />
            </>
          )}
          <span className="text-gray-600 dark:text-gray-400">
            {openBracket}
          </span>
          <span className="text-gray-500 dark:text-gray-400 italic mx-1">
            {formatValue(value)}
          </span>
          <span className="text-gray-600 dark:text-gray-400">
            {closeBracket}
          </span>
        </div>
      </div>
    );
  }

  // Expanded view - multi-line
  return (
    <>
      {/* Opening line with key and bracket */}
      <div className="flex items-start gap-1 py-0.5">
        <span className="select-none whitespace-pre font-mono text-transparent">
          {indentSpaces}
        </span>
        <button
          onClick={toggleExpand}
          className="shrink-0 mt-0.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded p-0.5 transition-colors"
          aria-label="Collapse"
        >
          <ChevronDown className="size-4 text-gray-600 dark:text-gray-400" />
        </button>
        <div className="flex items-start gap-1">
          {keyName !== null && (
            <>
              {renderKey()}
              <span className="text-gray-500 dark:text-gray-400">:</span>
              <span className="w-2" />
            </>
          )}
          <span className="text-gray-600 dark:text-gray-400">
            {openBracket}
          </span>
        </div>
      </div>

      {/* Child content */}
      {renderExpandableContent()}

      {/* Closing bracket */}
      <div className="flex items-start gap-1 py-0.5">
        <span className="select-none whitespace-pre font-mono text-transparent">
          {indentSpaces}
        </span>
        <div className="w-4 shrink-0" />
        <span className="text-gray-600 dark:text-gray-400">{closeBracket}</span>
      </div>
    </>
  );
}
