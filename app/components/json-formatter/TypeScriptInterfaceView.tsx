"use client";

import { useEffect, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useJsonFormatterStore } from "@/lib/stores/jsonFormatterStore";
import { useI18nStore } from "@/lib/stores/i18nStore";
import { t } from "@/lib/i18n";

interface TypeScriptInterfaceViewProps {
  inputId: string;
}

/**
 * TypeScript 코드를 토큰으로 분리하고 색상을 적용하는 함수
 */
function highlightTypeScript(code: string): JSX.Element[] {
  const lines = code.split("\n");
  const result: JSX.Element[] = [];
  let globalTokenIndex = 0;

  lines.forEach((line, lineIndex) => {
    const lineTokens: JSX.Element[] = [];
    let remaining = line;

    // 주석 처리
    const commentIndex = remaining.indexOf("//");
    if (commentIndex !== -1) {
      const beforeComment = remaining.substring(0, commentIndex);
      const comment = remaining.substring(commentIndex);
      if (beforeComment.trim()) {
        const beforeTokens = tokenizeCode(beforeComment, lineIndex, globalTokenIndex);
        globalTokenIndex += beforeTokens.length;
        lineTokens.push(...beforeTokens);
      }
      lineTokens.push(
        <span key={`${lineIndex}-comment-${globalTokenIndex++}`} className={getTokenClassName("comment")}>
          {comment}
        </span>
      );
      result.push(...lineTokens);
      if (lineIndex < lines.length - 1) {
        result.push(<br key={`br-${lineIndex}`} />);
      }
      return;
    }

    // 라인 토큰화
    const tokens = tokenizeCode(remaining, lineIndex, globalTokenIndex);
    globalTokenIndex += tokens.length;
    lineTokens.push(...tokens);
    result.push(...lineTokens);
    if (lineIndex < lines.length - 1) {
      result.push(<br key={`br-${lineIndex}`} />);
    }
  });

  return result;
}

/**
 * 코드 라인을 토큰으로 분리
 */
function tokenizeCode(line: string, lineIndex: number, startTokenIndex: number): JSX.Element[] {
  const tokens: JSX.Element[] = [];
  let remaining = line;
  let tokenIndex = startTokenIndex;

  // 키워드: interface, type
  const keywordRegex = /\b(interface|type)\b/;
  // 기본 타입
  const primitiveRegex = /\b(string|number|boolean|null|undefined|unknown|never|void|any)\b/;
  // 연산자
  const operatorRegex = /([|:;{}[\]()])/;

  while (remaining.length > 0) {
    let matched = false;
    let minIndex = Infinity;
    let matchType = "";
    let matchText = "";

    // 키워드 체크
    const keywordMatch = remaining.match(keywordRegex);
    if (keywordMatch && keywordMatch.index !== undefined && keywordMatch.index < minIndex) {
      minIndex = keywordMatch.index;
      matchType = "keyword";
      matchText = keywordMatch[0];
      matched = true;
    }

    // 기본 타입 체크
    const primitiveMatch = remaining.match(primitiveRegex);
    if (primitiveMatch && primitiveMatch.index !== undefined && primitiveMatch.index < minIndex) {
      minIndex = primitiveMatch.index;
      matchType = "primitive";
      matchText = primitiveMatch[0];
      matched = true;
    }

    // 연산자 체크
    const operatorMatch = remaining.match(operatorRegex);
    if (operatorMatch && operatorMatch.index !== undefined && operatorMatch.index < minIndex) {
      minIndex = operatorMatch.index;
      matchType = "operator";
      matchText = operatorMatch[0];
      matched = true;
    }

    if (matched) {
      // 매치 전의 텍스트 처리
      if (minIndex > 0) {
        const beforeText = remaining.substring(0, minIndex);
        const beforeTokens = parseTextSegment(beforeText, line, lineIndex, tokenIndex);
        tokenIndex += beforeTokens.length;
        tokens.push(...beforeTokens);
      }

      // 매치된 토큰 추가
      tokens.push(
        <span key={`${lineIndex}-${matchType}-${tokenIndex++}`} className={getTokenClassName(matchType)}>
          {matchText}
        </span>
      );

      remaining = remaining.substring(minIndex + matchText.length);
    } else {
      // 남은 텍스트 처리
      const remainingTokens = parseTextSegment(remaining, line, lineIndex, tokenIndex);
      tokens.push(...remainingTokens);
      break;
    }
  }

  return tokens;
}

/**
 * 텍스트 세그먼트를 파싱 (속성명, 타입명 등)
 */
function parseTextSegment(text: string, fullLine: string, lineIndex: number, startTokenIndex: number): JSX.Element[] {
  const tokens: JSX.Element[] = [];
  let tokenIndex = startTokenIndex;
  
  if (!text.trim()) {
    tokens.push(<span key={`${lineIndex}-text-${tokenIndex++}`}>{text}</span>);
    return tokens;
  }

  // 라인에서 속성명과 타입을 구분
  // 예: "  name: string;" -> 속성명: name, 타입: string
  const propertyMatch = fullLine.match(/^\s*([a-zA-Z_$][a-zA-Z0-9_$]*)\s*:\s*(.+?)\s*;?\s*$/);
  
  if (propertyMatch) {
    // 속성명 부분
    const propertyName = propertyMatch[1];
    const propertyNameIndex = text.indexOf(propertyName);
    
    if (propertyNameIndex !== -1) {
      // 속성명 전의 공백/들여쓰기
      if (propertyNameIndex > 0) {
        tokens.push(<span key={`${lineIndex}-text-${tokenIndex++}`}>{text.substring(0, propertyNameIndex)}</span>);
      }
      
      // 속성명
      tokens.push(
        <span key={`${lineIndex}-property-${tokenIndex++}`} className={getTokenClassName("property")}>
          {propertyName}
        </span>
      );
      
      // 속성명 이후의 텍스트 (콜론, 타입 등)
      const afterProperty = text.substring(propertyNameIndex + propertyName.length);
      if (afterProperty) {
        // 타입 부분 파싱
        const typeTokens = parseTypeExpression(afterProperty, lineIndex, tokenIndex);
        tokenIndex += typeTokens.length;
        tokens.push(...typeTokens);
      }
    } else {
      // 속성명이 텍스트에 없으면 일반 텍스트로 처리
      const typeTokens = parseTypeExpression(text, lineIndex, tokenIndex);
      tokens.push(...typeTokens);
    }
  } else {
    // 속성 선언이 아닌 경우 (인터페이스 이름, 타입 선언 등)
    const typeTokens = parseTypeExpression(text, lineIndex, tokenIndex);
    tokens.push(...typeTokens);
  }

  return tokens;
}

/**
 * 타입 표현식을 파싱 (타입명, 기본 타입 등)
 */
function parseTypeExpression(text: string, lineIndex: number, startTokenIndex: number): JSX.Element[] {
  const tokens: JSX.Element[] = [];
  let remaining = text;
  let tokenIndex = startTokenIndex;
  
  // 기본 타입
  const primitiveRegex = /\b(string|number|boolean|null|undefined|unknown|never|void|any)\b/;
  // 대문자로 시작하는 타입명
  const typeNameRegex = /\b([A-Z][a-zA-Z0-9_$]*)\b/;

  while (remaining.length > 0) {
    let matched = false;
    let minIndex = Infinity;
    let matchType = "";
    let matchText = "";

    // 기본 타입 체크
    const primitiveMatch = remaining.match(primitiveRegex);
    if (primitiveMatch && primitiveMatch.index !== undefined && primitiveMatch.index < minIndex) {
      minIndex = primitiveMatch.index;
      matchType = "primitive";
      matchText = primitiveMatch[0];
      matched = true;
    }

    // 타입명 체크
    const typeNameMatch = remaining.match(typeNameRegex);
    if (typeNameMatch && typeNameMatch.index !== undefined && typeNameMatch.index < minIndex) {
      minIndex = typeNameMatch.index;
      matchType = "type";
      matchText = typeNameMatch[1];
      matched = true;
    }

    if (matched) {
      // 매치 전의 텍스트
      if (minIndex > 0) {
        tokens.push(<span key={`${lineIndex}-text-${tokenIndex++}`}>{remaining.substring(0, minIndex)}</span>);
      }

      // 매치된 토큰
      tokens.push(
        <span key={`${lineIndex}-${matchType}-${tokenIndex++}`} className={getTokenClassName(matchType)}>
          {matchText}
        </span>
      );

      remaining = remaining.substring(minIndex + matchText.length);
    } else {
      // 남은 텍스트
      tokens.push(<span key={`${lineIndex}-text-${tokenIndex++}`}>{remaining}</span>);
      break;
    }
  }

  return tokens;
}

/**
 * 토큰 타입에 따른 CSS 클래스 반환
 */
function getTokenClassName(type: string): string {
  switch (type) {
    case "keyword":
      return "text-blue-600 dark:text-blue-400 font-semibold";
    case "primitive":
      return "text-purple-600 dark:text-purple-400";
    case "type":
      return "text-emerald-600 dark:text-emerald-400 font-medium";
    case "property":
      return "text-orange-600 dark:text-orange-400";
    case "operator":
      return "text-gray-600 dark:text-gray-400";
    case "comment":
      return "text-gray-500 dark:text-gray-500 italic";
    default:
      return "text-gray-900 dark:text-gray-100";
  }
}

export function TypeScriptInterfaceView({
  inputId,
}: TypeScriptInterfaceViewProps) {
  const generateTypeScriptInterface = useJsonFormatterStore(
    (state) => state.generateTypeScriptInterface
  );
  const typescriptInterfaces = useJsonFormatterStore(
    (state) => state.typescriptInterfaces
  );
  const language = useI18nStore((state) => state.language);

  const interfaceData = typescriptInterfaces[inputId];

  useEffect(() => {
    // 인터페이스가 없으면 생성
    if (!interfaceData) {
      generateTypeScriptInterface(inputId);
    }
  }, [inputId, interfaceData, generateTypeScriptInterface]);

  if (!interfaceData) {
    return (
      <Card className="h-full">
        <CardContent className="flex items-center justify-center h-full py-8">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {t("jsonFormatter.interfaceView.generating", language)}
          </p>
        </CardContent>
      </Card>
    );
  }

  if (interfaceData.error) {
    return (
      <Card className="h-full">
        <CardContent className="p-4">
          <p className="text-sm text-red-600 dark:text-red-400 font-mono">
            {interfaceData.error}
          </p>
        </CardContent>
      </Card>
    );
  }

  if (!interfaceData.interfaceString) {
    return (
      <Card className="h-full">
        <CardContent className="flex items-center justify-center h-full py-8">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {t("jsonFormatter.interfaceView.noInterface", language)}
          </p>
        </CardContent>
      </Card>
    );
  }

  const highlightedCode = useMemo(() => {
    if (!interfaceData.interfaceString) return null;
    return highlightTypeScript(interfaceData.interfaceString);
  }, [interfaceData.interfaceString]);

  return (
    <Card className="h-full flex flex-col">
      <CardContent className="flex-1 p-4 overflow-hidden">
        <ScrollArea className="h-full w-full">
          <pre className="font-mono text-sm overflow-x-auto whitespace-pre">
            <code>{highlightedCode}</code>
          </pre>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

