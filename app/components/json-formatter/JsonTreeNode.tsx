"use client";

import { useState, useEffect } from "react";
import { ChevronRight, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useI18nStore } from "@/lib/stores/i18nStore";
import { t } from "@/lib/i18n";
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
  indentDepth?: number;
  currentSearchIndex?: number;
  nodeRef?: React.RefObject<HTMLDivElement | null>;
  expandAll?: boolean;
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
  indentDepth = 2,
  currentSearchIndex = -1,
  nodeRef,
  expandAll,
}: JsonTreeNodeProps) {
  const valueType = getValueType(value);
  const isExpandable = valueType === "object" || valueType === "array";
  // 뎁스당 스페이스로 들여쓰기
  const indentSpaces = " ".repeat(depth * indentDepth);
  const language = useI18nStore((state) => state.language);

  // 검색 결과에서 현재 경로에 해당하는 결과 찾기
  const currentSearchResult = searchResults.find(
    (result) => result.inputId === inputId && result.path === path
  );
  const isKeyHighlighted = currentSearchResult?.matchedField === "key";
  const isValueHighlighted = currentSearchResult?.matchedField === "value";

  // 현재 검색 인덱스에 해당하는 결과인지 확인
  const relevantResults = searchResults.filter(
    (result) => result.inputId === inputId
  );
  const resultIndex = relevantResults.findIndex(
    (result) => result.path === path
  );
  const isCurrentSearchResult =
    resultIndex === currentSearchIndex && resultIndex >= 0;

  // 초기 렌더링 시 확장해야 하는 경로인지 확인
  const shouldExpandInitially = pathsToExpand.has(path) && isExpandable;
  const [isExpanded, setIsExpanded] = useState(
    shouldExpandInitially || depth < 2
  );

  // expandAll prop이 변경되면 모든 노드 확장/축소
  useEffect(() => {
    if (expandAll !== undefined && isExpandable) {
      setIsExpanded(expandAll);
    }
  }, [expandAll, isExpandable]);

  // 검색 결과가 있을 때 자동 확장
  useEffect(() => {
    if (pathsToExpand.has(path) && isExpandable && !isExpanded) {
      setIsExpanded(true);
    }
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
          isKeyHighlighted &&
            !isCurrentSearchResult &&
            "bg-yellow-200 dark:bg-yellow-800 rounded px-1",
          isKeyHighlighted &&
            isCurrentSearchResult &&
            "bg-yellow-400 dark:bg-yellow-600 rounded px-1"
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
          isValueHighlighted &&
            !isCurrentSearchResult &&
            "bg-yellow-200 dark:bg-yellow-800 rounded px-1",
          isValueHighlighted &&
            isCurrentSearchResult &&
            "bg-yellow-400 dark:bg-yellow-600 rounded px-1"
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
                depth={depth + 1}
                path={childPath}
                highlightedPaths={highlightedPaths}
                searchResults={searchResults}
                inputId={inputId}
                pathsToExpand={pathsToExpand}
                indentDepth={indentDepth}
                currentSearchIndex={currentSearchIndex}
                expandAll={expandAll}
                nodeRef={nodeRef}
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
                depth={depth + 1}
                path={childPath}
                highlightedPaths={highlightedPaths}
                searchResults={searchResults}
                inputId={inputId}
                pathsToExpand={pathsToExpand}
                indentDepth={indentDepth}
                currentSearchIndex={currentSearchIndex}
                expandAll={expandAll}
                nodeRef={nodeRef}
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
      <div
        ref={isCurrentSearchResult ? nodeRef : undefined}
        className="flex items-start gap-1 py-0.5"
      >
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
      <div
        ref={isCurrentSearchResult ? nodeRef : undefined}
        className="flex items-start gap-1 py-0.5"
      >
        <span className="select-none whitespace-pre font-mono text-transparent">
          {indentSpaces}
        </span>
        <button
          onClick={toggleExpand}
          className="shrink-0 mt-0.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded p-0.5 transition-colors"
          aria-label={t("jsonFormatter.treeNode.expand", language)}
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
      <div
        ref={isCurrentSearchResult ? nodeRef : undefined}
        className="flex items-start gap-1 py-0.5"
      >
        <span className="select-none whitespace-pre font-mono text-transparent">
          {indentSpaces}
        </span>
        <button
          onClick={toggleExpand}
          className="shrink-0 mt-0.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded p-0.5 transition-colors"
          aria-label={t("jsonFormatter.treeNode.collapse", language)}
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
