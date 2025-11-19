/**
 * JSON 데이터를 TypeScript 인터페이스로 변환하는 유틸리티
 */

interface TypeInfo {
  type: string;
  interfaces: Map<string, string>; // interfaceName -> interfaceString
  usedNames: Map<string, number>; // baseName -> count (중복 체크용)
}

/**
 * 타입 이름을 유효한 TypeScript 식별자로 변환
 */
function sanitizeTypeName(name: string): string {
  // 숫자로 시작하거나 특수문자가 있으면 처리
  let sanitized = name.replace(/[^a-zA-Z0-9_$]/g, "");
  if (/^\d/.test(sanitized)) {
    sanitized = "_" + sanitized;
  }
  if (!sanitized) {
    sanitized = "Unknown";
  }
  // 첫 글자를 대문자로
  return sanitized.charAt(0).toUpperCase() + sanitized.slice(1);
}

/**
 * 경로에서 마지막 값만 사용하여 인터페이스 이름 생성 (중복 시 숫자 추가)
 * 모든 인터페이스 이름 앞에 "I" 접두사 추가
 */
function generateInterfaceName(
  baseName: string,
  path: string[],
  usedNames: Map<string, number>
): string {
  // 뎁스의 마지막 값만 사용
  const lastPath = path.length > 0 ? path[path.length - 1] : "";
  const baseInterfaceName = lastPath
    ? sanitizeTypeName(lastPath.replace(/[\[\]]/g, ""))
    : sanitizeTypeName(baseName);

  // 중복 체크 및 숫자 추가 (I 접두사 없이 체크)
  let finalName: string;
  if (usedNames.has(baseInterfaceName)) {
    const count = usedNames.get(baseInterfaceName)! + 1;
    usedNames.set(baseInterfaceName, count);
    finalName = `${baseInterfaceName}${count}`;
  } else {
    usedNames.set(baseInterfaceName, 0);
    finalName = baseInterfaceName;
  }

  // "I" 접두사 추가
  return `I${finalName}`;
}

/**
 * 타입을 추론하고 인터페이스를 생성
 */
function inferType(
  value: unknown,
  interfaceName: string,
  typeInfo: TypeInfo,
  path: string[] = []
): string {
  if (value === null) {
    return "null";
  }

  if (value === undefined) {
    return "undefined";
  }

  const valueType = typeof value;

  if (valueType === "string") {
    return "string";
  }

  if (valueType === "number") {
    return "number";
  }

  if (valueType === "boolean") {
    return "boolean";
  }

  if (Array.isArray(value)) {
    if (value.length === 0) {
      return "unknown[]";
    }

    // 배열의 모든 요소 타입을 수집 (union 타입 생성)
    const elementTypes = new Set<string>();

    value.forEach((item, index) => {
      const itemType = inferType(item, `${interfaceName}Item`, typeInfo, [
        ...path,
        `[${index}]`,
      ]);
      elementTypes.add(itemType);
    });

    // union 타입 생성
    const typesArray = Array.from(elementTypes);
    if (typesArray.length === 1) {
      return `${typesArray[0]}[]`;
    }
    return `(${typesArray.join(" | ")})[]`;
  }

  if (valueType === "object" && value !== null) {
    const obj = value as Record<string, unknown>;
    // 뎁스의 마지막 값만 사용하여 인터페이스 이름 생성
    const nestedInterfaceName = generateInterfaceName(
      `${interfaceName}Item`,
      path,
      typeInfo.usedNames
    );

    // 중첩 인터페이스 생성
    if (!typeInfo.interfaces.has(nestedInterfaceName)) {
      const nestedInterface = generateInterface(
        obj,
        nestedInterfaceName,
        typeInfo,
        path
      );
      typeInfo.interfaces.set(nestedInterfaceName, nestedInterface);
    }

    return nestedInterfaceName;
  }

  return "unknown";
}

/**
 * 객체에서 인터페이스 생성
 */
function generateInterface(
  obj: Record<string, unknown>,
  interfaceName: string,
  typeInfo: TypeInfo,
  parentPath: string[] = []
): string {
  const properties: string[] = [];
  const seenKeys = new Set<string>();

  for (const [key, value] of Object.entries(obj)) {
    if (seenKeys.has(key)) continue;
    seenKeys.add(key);

    // null 가능성 처리: 값이 null이면 unknown | null로 표시
    if (value === null) {
      properties.push(`  ${key}: unknown | null;`);
      continue;
    }

    const inferredType = inferType(value, interfaceName, typeInfo, [
      ...parentPath,
      key,
    ]);

    properties.push(`  ${key}: ${inferredType};`);
  }

  return `interface ${interfaceName} {\n${properties.join("\n")}\n}`;
}

/**
 * JSON 데이터를 TypeScript 인터페이스로 변환
 * @param data - 변환할 JSON 데이터
 * @param rootInterfaceName - 루트 인터페이스 이름 (기본값: "Root")
 * @returns TypeScript 인터페이스 문자열
 */
export function jsonToInterface(
  data: unknown,
  rootInterfaceName: string = "Root"
): string {
  if (data === null || data === undefined) {
    const rootInterfaceNameWithI = `I${sanitizeTypeName(rootInterfaceName)}`;
    return `interface ${rootInterfaceNameWithI} {\n  // null or undefined\n}`;
  }

  const typeInfo: TypeInfo = {
    type: "",
    interfaces: new Map(),
    usedNames: new Map(),
  };

  const sanitizedName = sanitizeTypeName(rootInterfaceName);
  // 루트 인터페이스 이름도 usedNames에 추가 (I 접두사 없이)
  typeInfo.usedNames.set(sanitizedName, 0);
  // 루트 인터페이스 이름에 "I" 접두사 추가
  const rootInterfaceNameWithI = `I${sanitizedName}`;

  if (Array.isArray(data)) {
    if (data.length === 0) {
      const itemName = generateInterfaceName("Item", [], typeInfo.usedNames);
      return `interface ${itemName} {\n  // empty array\n}\n\ntype ${rootInterfaceNameWithI} = ${itemName}[];`;
    }

    // 배열의 첫 번째 요소로 타입 추론
    const firstItem = data[0];
    if (
      typeof firstItem === "object" &&
      firstItem !== null &&
      !Array.isArray(firstItem)
    ) {
      const itemName = generateInterfaceName("Item", [], typeInfo.usedNames);
      generateInterface(
        firstItem as Record<string, unknown>,
        itemName,
        typeInfo,
        []
      );
    }

    const itemType = inferType(firstItem, "Item", typeInfo, []);
    const interfaces = Array.from(typeInfo.interfaces.values()).join("\n\n");
    const mainType = `type ${rootInterfaceNameWithI} = ${itemType}[];`;

    return interfaces ? `${interfaces}\n\n${mainType}` : mainType;
  }

  if (typeof data === "object" && data !== null) {
    generateInterface(
      data as Record<string, unknown>,
      rootInterfaceNameWithI,
      typeInfo,
      []
    );
    const interfaces = Array.from(typeInfo.interfaces.values());
    return interfaces.join("\n\n");
  }

  // 원시 타입인 경우
  const primitiveType = inferType(data, sanitizedName, typeInfo, []);
  return `type ${rootInterfaceNameWithI} = ${primitiveType};`;
}
