'use client';

import { useState } from 'react';
import { ChevronRight, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface JsonTreeNodeProps {
  keyName: string | number | null;
  value: unknown;
  depth: number;
  path: string;
  highlightedPaths?: Set<string>;
}

function formatValue(value: unknown): string {
  if (value === null) return 'null';
  if (value === undefined) return 'undefined';
  if (typeof value === 'string') return `"${value}"`;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (Array.isArray(value)) return `[${value.length}]`;
  if (typeof value === 'object') {
    const keys = Object.keys(value);
    return `{${keys.length}}`;
  }
  return String(value);
}

function getValueType(value: unknown): 'object' | 'array' | 'primitive' {
  if (value === null || value === undefined) return 'primitive';
  if (Array.isArray(value)) return 'array';
  if (typeof value === 'object') return 'object';
  return 'primitive';
}

export function JsonTreeNode({
  keyName,
  value,
  depth,
  path,
  highlightedPaths = new Set(),
}: JsonTreeNodeProps) {
  const [isExpanded, setIsExpanded] = useState(depth < 2);
  const valueType = getValueType(value);
  const isExpandable = valueType === 'object' || valueType === 'array';
  const indent = depth * 20;
  const isHighlighted = highlightedPaths.has(path);

  const toggleExpand = () => {
    if (isExpandable) {
      setIsExpanded(!isExpanded);
    }
  };

  const renderKey = () => {
    if (keyName === null) return null;
    return (
      <span className="text-blue-600 dark:text-blue-400 font-medium">
        {typeof keyName === 'number' ? `[${keyName}]` : `"${keyName}"`}
      </span>
    );
  };

  const renderPrimitive = () => {
    const formatted = formatValue(value);
    const valueClass =
      typeof value === 'string'
        ? 'text-green-600 dark:text-green-400'
        : typeof value === 'number'
          ? 'text-purple-600 dark:text-purple-400'
          : typeof value === 'boolean'
            ? 'text-orange-600 dark:text-orange-400'
            : 'text-gray-500 dark:text-gray-400';

    return <span className={valueClass}>{formatted}</span>;
  };

  const renderExpandableContent = () => {
    if (!isExpanded) {
      const preview = formatValue(value);
      return <span className="text-gray-500 dark:text-gray-400">{preview}</span>;
    }

    if (valueType === 'object' && value !== null && typeof value === 'object') {
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
              />
            );
          })}
        </>
      );
    }

    if (valueType === 'array' && Array.isArray(value)) {
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
              />
            );
          })}
        </>
      );
    }

    return null;
  };

  return (
    <div
      className={cn(
        'flex items-start gap-1 py-0.5',
        isHighlighted && 'bg-yellow-100 dark:bg-yellow-900/20 rounded px-1'
      )}
      style={{ paddingLeft: `${indent}px` }}
    >
      {isExpandable && (
        <button
          onClick={toggleExpand}
          className="flex-shrink-0 mt-0.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded p-0.5 transition-colors"
          aria-label={isExpanded ? 'Collapse' : 'Expand'}
        >
          {isExpanded ? (
            <ChevronDown className="size-4 text-gray-600 dark:text-gray-400" />
          ) : (
            <ChevronRight className="size-4 text-gray-600 dark:text-gray-400" />
          )}
        </button>
      )}
      {!isExpandable && <div className="w-5 flex-shrink-0" />}
      
      <div className="flex items-start gap-1 flex-1 min-w-0">
        {keyName !== null && (
          <>
            {renderKey()}
            <span className="text-gray-500 dark:text-gray-400">:</span>
            <span className="w-2" />
          </>
        )}
        {isExpandable ? (
          <div className="flex-1">
            {valueType === 'object' && (
              <>
                <span className="text-gray-600 dark:text-gray-400">{'{'}</span>
                {isExpanded && (
                  <div className="ml-0">
                    {renderExpandableContent()}
                  </div>
                )}
                <span className="text-gray-600 dark:text-gray-400">{'}'}</span>
              </>
            )}
            {valueType === 'array' && (
              <>
                <span className="text-gray-600 dark:text-gray-400">{'['}</span>
                {isExpanded && (
                  <div className="ml-0">
                    {renderExpandableContent()}
                  </div>
                )}
                <span className="text-gray-600 dark:text-gray-400">{']'}</span>
              </>
            )}
          </div>
        ) : (
          renderPrimitive()
        )}
      </div>
    </div>
  );
}

