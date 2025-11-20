/**
 * JSON 문자열에서 특정 경로의 값이 시작하는 위치를 찾습니다.
 * @param jsonString - JSON 문자열
 * @param path - 찾을 경로 (예: "$.name", "$.meta.updatedAt", "$.features[0]")
 * @param value - 찾을 값 (선택사항, 더 정확한 매칭을 위해)
 * @returns 시작 위치와 끝 위치, 또는 null
 */
export function findJsonPathInString(
  jsonString: string,
  path: string,
  value?: unknown
): { start: number; end: number } | null {
  try {
    const parsed = JSON.parse(jsonString);
    const targetValue = getValueByPath(parsed, path);
    
    if (targetValue === undefined) {
      return null;
    }

    // value가 제공되었고 일치하지 않으면 null 반환
    if (value !== undefined && !deepEqual(targetValue, value)) {
      return null;
    }

    // 값을 JSON 문자열로 변환하여 직접 찾기
    const valueString = JSON.stringify(targetValue);
    let searchStart = 0;

    // 경로 분석: 배열 인덱스인지 객체 프로퍼티인지 확인
    const parts = parsePath(path);
    if (parts.length === 0) {
      return null;
    }

    const lastPart = parts[parts.length - 1];
    
    // 배열 요소인 경우
    if (lastPart.type === "index") {
      // 부모 키가 있으면 해당 키부터 찾기
      if (parts.length >= 2) {
        const parentPart = parts[parts.length - 2];
        if (parentPart.type === "property") {
          const parentKeyPattern = new RegExp(
            `"${escapeRegex(parentPart.name)}"\\s*:\\s*\\[`,
            "g"
          );
          const parentMatch = parentKeyPattern.exec(jsonString);
          if (parentMatch) {
            searchStart = parentKeyPattern.lastIndex;
          }
        }
      }
      
      // 값 자체를 찾기
      return findValueByContent(jsonString, valueString, searchStart);
    }

    // 객체 프로퍼티인 경우
    if (lastPart.type === "property") {
      const keyPattern = new RegExp(
        `"${escapeRegex(lastPart.name)}"\\s*:`,
        "g"
      );

      let bestMatch: { start: number; end: number } | null = null;

      // 모든 매칭을 확인하고 가장 적절한 것을 선택
      while (keyPattern.exec(jsonString) !== null) {
        const afterColon = keyPattern.lastIndex;
        
        // 콜론 이후의 공백 건너뛰기
        let valueStart = afterColon;
        while (valueStart < jsonString.length && /\s/.test(jsonString[valueStart])) {
          valueStart++;
        }

        // 값의 끝 찾기
        const valueEnd = findValueEnd(jsonString, valueStart);
        if (valueEnd === -1) continue;

        // 이 위치의 값을 파싱해서 확인
        try {
          const candidateValue = JSON.parse(jsonString.substring(valueStart, valueEnd));
          if (deepEqual(candidateValue, targetValue)) {
            bestMatch = { start: valueStart, end: valueEnd };
            break; // 첫 번째 매칭을 사용
          }
        } catch {
          // 파싱 실패 시 계속
          continue;
        }
      }

      return bestMatch;
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * 값의 내용으로 직접 찾기
 */
function findValueByContent(
  jsonString: string,
  valueString: string,
  startFrom = 0
): { start: number; end: number } | null {
  const index = jsonString.indexOf(valueString, startFrom);
  if (index === -1) return null;
  return { start: index, end: index + valueString.length };
}

/**
 * 경로에서 값을 가져옵니다.
 */
function getValueByPath(obj: unknown, path: string): unknown {
  if (path === "$" || path === "") {
    return obj;
  }

  const parts = parsePath(path);
  let current: unknown = obj;

  for (const part of parts) {
    if (current === null || current === undefined) {
      return undefined;
    }

    if (part.type === "property") {
      if (typeof current !== "object" || current === null || Array.isArray(current)) {
        return undefined;
      }
      current = (current as Record<string, unknown>)[part.name];
    } else if (part.type === "index") {
      if (!Array.isArray(current)) {
        return undefined;
      }
      current = current[part.index];
    }
  }

  return current;
}

/**
 * 경로를 파싱합니다 (예: "$.name" -> [{type: "property", name: "name"}])
 */
function parsePath(path: string): Array<{ type: "property"; name: string } | { type: "index"; index: number }> {
  if (path.startsWith("$.")) {
    path = path.substring(2);
  } else if (path === "$") {
    return [];
  }

  const parts: Array<{ type: "property"; name: string } | { type: "index"; index: number }> = [];
  let current = "";
  let inBrackets = false;

  for (let i = 0; i < path.length; i++) {
    const char = path[i];

    if (char === "[") {
      if (current) {
        parts.push({ type: "property", name: current });
        current = "";
      }
      inBrackets = true;
    } else if (char === "]") {
      if (inBrackets) {
        const index = parseInt(current, 10);
        if (!isNaN(index)) {
          parts.push({ type: "index", index });
        }
        current = "";
        inBrackets = false;
      }
    } else if (char === "." && !inBrackets) {
      if (current) {
        parts.push({ type: "property", name: current });
        current = "";
      }
    } else {
      current += char;
    }
  }

  if (current && !inBrackets) {
    parts.push({ type: "property", name: current });
  }

  return parts;
}

/**
 * JSON 문자열에서 값의 끝 위치를 찾습니다.
 */
function findValueEnd(jsonString: string, start: number): number {
  if (start >= jsonString.length) return -1;

  const firstChar = jsonString[start];
  
  // 문자열
  if (firstChar === '"') {
    let i = start + 1;
    let escaped = false;
    while (i < jsonString.length) {
      if (escaped) {
        escaped = false;
        i++;
        continue;
      }
      if (jsonString[i] === '\\') {
        escaped = true;
        i++;
        continue;
      }
      if (jsonString[i] === '"') {
        return i + 1;
      }
      i++;
    }
    return -1;
  }

  // 숫자
  if (/[0-9-]/.test(firstChar)) {
    let i = start;
    while (i < jsonString.length && /[0-9.eE+-]/.test(jsonString[i])) {
      i++;
    }
    return i;
  }

  // boolean, null
  if (firstChar === 't' && jsonString.substring(start, start + 4) === 'true') {
    return start + 4;
  }
  if (firstChar === 'f' && jsonString.substring(start, start + 5) === 'false') {
    return start + 5;
  }
  if (firstChar === 'n' && jsonString.substring(start, start + 4) === 'null') {
    return start + 4;
  }

  // 객체
  if (firstChar === '{') {
    let depth = 1;
    let i = start + 1;
    while (i < jsonString.length && depth > 0) {
      if (jsonString[i] === '"') {
        // 문자열 내부 건너뛰기
        i++;
        while (i < jsonString.length && jsonString[i] !== '"') {
          if (jsonString[i] === '\\') i++;
          i++;
        }
        i++;
        continue;
      }
      if (jsonString[i] === '{') depth++;
      if (jsonString[i] === '}') depth--;
      i++;
    }
    return i;
  }

  // 배열
  if (firstChar === '[') {
    let depth = 1;
    let i = start + 1;
    while (i < jsonString.length && depth > 0) {
      if (jsonString[i] === '"') {
        // 문자열 내부 건너뛰기
        i++;
        while (i < jsonString.length && jsonString[i] !== '"') {
          if (jsonString[i] === '\\') i++;
          i++;
        }
        i++;
        continue;
      }
      if (jsonString[i] === '[') depth++;
      if (jsonString[i] === ']') depth--;
      i++;
    }
    return i;
  }

  return -1;
}

/**
 * 깊은 비교
 */
function deepEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (a === null || b === null) return a === b;
  if (typeof a !== typeof b) return false;
  if (typeof a !== "object") return a === b;
  if (Array.isArray(a) !== Array.isArray(b)) return false;

  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    return a.every((item, index) => deepEqual(item, b[index]));
  }

  if (typeof a === "object" && typeof b === "object") {
    const keysA = Object.keys(a as Record<string, unknown>);
    const keysB = Object.keys(b as Record<string, unknown>);
    if (keysA.length !== keysB.length) return false;
    return keysA.every((key) => deepEqual((a as Record<string, unknown>)[key], (b as Record<string, unknown>)[key]));
  }

  return false;
}

/**
 * 정규식 특수 문자 이스케이프
 */
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

