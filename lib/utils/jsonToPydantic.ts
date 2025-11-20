/**
 * JSON 데이터를 Python Pydantic 모델로 변환하는 유틸리티
 */

interface PydanticTypeInfo {
  models: Map<string, string>; // modelName -> modelString
  usedNames: Map<string, number>; // baseName -> count (중복 체크용)
  imports: Set<string>; // 필요한 import 문 수집
}

/**
 * 타입 이름을 유효한 Python 클래스 이름으로 변환
 */
function sanitizeTypeName(name: string): string {
  // 숫자로 시작하거나 특수문자가 있으면 처리
  let sanitized = name.replace(/[^a-zA-Z0-9_]/g, "");
  if (/^\d/.test(sanitized)) {
    sanitized = "_" + sanitized;
  }
  if (!sanitized) {
    sanitized = "Unknown";
  }
  // 첫 글자를 대문자로 (PascalCase)
  return sanitized.charAt(0).toUpperCase() + sanitized.slice(1);
}

/**
 * 경로에서 마지막 값만 사용하여 모델 이름 생성 (중복 시 숫자 추가)
 */
function generateModelName(
  baseName: string,
  path: string[],
  usedNames: Map<string, number>
): string {
  // 뎁스의 마지막 값만 사용
  const lastPath = path.length > 0 ? path[path.length - 1] : "";
  const baseModelName = lastPath
    ? sanitizeTypeName(lastPath.replace(/[\[\]]/g, ""))
    : sanitizeTypeName(baseName);

  // 중복 체크 및 숫자 추가
  let finalName: string;
  if (usedNames.has(baseModelName)) {
    const count = usedNames.get(baseModelName)! + 1;
    usedNames.set(baseModelName, count);
    finalName = `${baseModelName}${count}`;
  } else {
    usedNames.set(baseModelName, 0);
    finalName = baseModelName;
  }

  return finalName;
}

/**
 * 필드명을 Python 식별자로 변환 (snake_case는 선택사항이므로 일단 원본 유지)
 */
function sanitizeFieldName(name: string): string {
  // Python 식별자로 유효한 문자만 남김
  let sanitized = name.replace(/[^a-zA-Z0-9_]/g, "");
  if (/^\d/.test(sanitized)) {
    sanitized = "_" + sanitized;
  }
  if (!sanitized) {
    sanitized = "field";
  }
  return sanitized;
}

/**
 * 숫자가 정수인지 실수인지 판단
 */
function isInteger(value: number): boolean {
  return Number.isInteger(value);
}

/**
 * 타입을 추론하고 모델을 생성
 */
function inferType(
  value: unknown,
  modelName: string,
  typeInfo: PydanticTypeInfo,
  path: string[] = []
): string {
  if (value === null) {
    typeInfo.imports.add("Optional");
    return "Optional[Any]";
  }

  const valueType = typeof value;

  if (valueType === "string") {
    return "str";
  }

  if (valueType === "number") {
    return isInteger(value as number) ? "int" : "float";
  }

  if (valueType === "boolean") {
    return "bool";
  }

  if (Array.isArray(value)) {
    typeInfo.imports.add("List");
    if (value.length === 0) {
      typeInfo.imports.add("Any");
      return "List[Any]";
    }

    // 배열의 모든 요소 타입을 수집 (union 타입 생성)
    const elementTypes = new Set<string>();

    value.forEach((item, index) => {
      const itemType = inferType(item, `${modelName}Item`, typeInfo, [
        ...path,
        `[${index}]`,
      ]);
      elementTypes.add(itemType);
    });

    // union 타입 생성
    const typesArray = Array.from(elementTypes);
    if (typesArray.length === 1) {
      return `List[${typesArray[0]}]`;
    }
    typeInfo.imports.add("Union");
    return `List[Union[${typesArray.join(", ")}]]`;
  }

  if (valueType === "object" && value !== null) {
    const obj = value as Record<string, unknown>;
    // 뎁스의 마지막 값만 사용하여 모델 이름 생성
    const nestedModelName = generateModelName(
      `${modelName}Item`,
      path,
      typeInfo.usedNames
    );

    // 중첩 모델 생성
    if (!typeInfo.models.has(nestedModelName)) {
      const nestedModel = generateModel(obj, nestedModelName, typeInfo, path);
      typeInfo.models.set(nestedModelName, nestedModel);
    }

    return nestedModelName;
  }

  typeInfo.imports.add("Any");
  return "Any";
}

/**
 * 객체에서 Pydantic 모델 생성
 */
function generateModel(
  obj: Record<string, unknown>,
  modelName: string,
  typeInfo: PydanticTypeInfo,
  parentPath: string[] = []
): string {
  const fields: string[] = [];
  const seenKeys = new Set<string>();

  for (const [key, value] of Object.entries(obj)) {
    if (seenKeys.has(key)) continue;
    seenKeys.add(key);

    const fieldName = sanitizeFieldName(key);
    const inferredType = inferType(value, modelName, typeInfo, [
      ...parentPath,
      key,
    ]);

    // null 가능성 처리
    if (value === null) {
      typeInfo.imports.add("Optional");
      fields.push(`    ${fieldName}: ${inferredType} = None`);
    } else {
      // Optional 체크: 타입에 Optional이 포함되어 있지 않으면 그대로 사용
      fields.push(`    ${fieldName}: ${inferredType}`);
    }
  }

  return `class ${modelName}(BaseModel):\n${
    fields.length > 0 ? fields.join("\n") : "    pass"
  }`;
}

/**
 * 필요한 import 문 생성
 */
function generateImports(importSet: Set<string>): string {
  const importList = Array.from(importSet).sort();
  const importStatements: string[] = [];

  // BaseModel은 항상 필요
  importStatements.push("from pydantic import BaseModel");

  // typing 모듈에서 필요한 것들
  const typingImports: string[] = [];
  if (importList.includes("Optional")) {
    typingImports.push("Optional");
  }
  if (importList.includes("List")) {
    typingImports.push("List");
  }
  if (importList.includes("Union")) {
    typingImports.push("Union");
  }
  if (importList.includes("Any")) {
    typingImports.push("Any");
  }

  if (typingImports.length > 0) {
    importStatements.push(`from typing import ${typingImports.join(", ")}`);
  }

  return importStatements.join("\n");
}

/**
 * JSON 데이터를 Python Pydantic 모델로 변환
 * @param data - 변환할 JSON 데이터
 * @param rootModelName - 루트 모델 이름 (기본값: "Root")
 * @returns Python Pydantic 모델 문자열
 */
export function jsonToPydantic(
  data: unknown,
  rootModelName: string = "Root"
): string {
  const typeInfo: PydanticTypeInfo = {
    models: new Map(),
    usedNames: new Map(),
    imports: new Set(),
  };

  const sanitizedName = sanitizeTypeName(rootModelName);
  typeInfo.usedNames.set(sanitizedName, 0);
  const rootModelNameSanitized = sanitizedName;

  if (data === null || data === undefined) {
    typeInfo.imports.add("Any");
    const imports = generateImports(typeInfo.imports);
    return `${imports}\n\n\nclass ${rootModelNameSanitized}(BaseModel):\n    # null or undefined\n    pass`;
  }

  if (Array.isArray(data)) {
    if (data.length === 0) {
      const itemName = generateModelName("Item", [], typeInfo.usedNames);
      typeInfo.imports.add("List");
      typeInfo.imports.add("Any");
      const imports = generateImports(typeInfo.imports);
      return `${imports}\n\n\nclass ${itemName}(BaseModel):\n    # empty array\n    pass\n\n\n${rootModelNameSanitized} = List[${itemName}]`;
    }

    // 배열의 첫 번째 요소로 타입 추론
    const firstItem = data[0];
    if (
      typeof firstItem === "object" &&
      firstItem !== null &&
      !Array.isArray(firstItem)
    ) {
      const itemName = generateModelName("Item", [], typeInfo.usedNames);
      generateModel(
        firstItem as Record<string, unknown>,
        itemName,
        typeInfo,
        []
      );
    }

    const itemType = inferType(firstItem, "Item", typeInfo, []);
    typeInfo.imports.add("List");
    const models = Array.from(typeInfo.models.values());
    const imports = generateImports(typeInfo.imports);
    const mainType = `${rootModelNameSanitized} = List[${itemType}]`;

    if (models.length > 0) {
      return `${imports}\n\n\n${models.join("\n\n\n")}\n\n\n${mainType}`;
    }
    return `${imports}\n\n\n${mainType}`;
  }

  if (typeof data === "object" && data !== null) {
    generateModel(
      data as Record<string, unknown>,
      rootModelNameSanitized,
      typeInfo,
      []
    );
    const models = Array.from(typeInfo.models.values());
    const imports = generateImports(typeInfo.imports);

    // 루트 모델이 typeInfo.models에 포함되어 있으므로 그대로 반환
    return `${imports}\n\n\n${models.join("\n\n\n")}`;
  }

  // 원시 타입인 경우
  const primitiveType = inferType(data, sanitizedName, typeInfo, []);
  const imports = generateImports(typeInfo.imports);
  return `${imports}\n\n\n${rootModelNameSanitized} = ${primitiveType}`;
}
