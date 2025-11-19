import { create } from "zustand";
import type { JsonInput, SearchResult } from "../types/jsonFormatter";
import { jsonToInterface } from "../utils/jsonToInterface";

interface TypeScriptInterface {
  interfaceString: string | null;
  error: string | null;
}

interface JsonFormatterState {
  jsonObjects: JsonInput[];
  searchQuery: string;
  searchResults: SearchResult[];
  searchMode: "global" | "individual";
  individualSearchResults: Record<string, SearchResult[]>;
  indentDepth: number;
  typescriptInterfaces: Record<string, TypeScriptInterface>;

  addJsonObject: (rawText: string) => void;
  removeJsonObject: (id: string) => void;
  updateJsonObject: (id: string, rawText: string) => void;
  setSearchQuery: (query: string) => void;
  performSearch: () => void;
  clearSearch: () => void;
  setSearchMode: (mode: "global" | "individual") => void;
  performIndividualSearch: (inputId: string, query: string) => void;
  clearIndividualSearch: (inputId: string) => void;
  setIndentDepth: (depth: number) => void;
  generateTypeScriptInterface: (inputId: string) => void;
}

export const useJsonFormatterStore = create<JsonFormatterState>((set, get) => ({
  jsonObjects: [],
  searchQuery: "",
  searchResults: [],
  searchMode: "global",
  individualSearchResults: {},
  indentDepth: 2,
  typescriptInterfaces: {},

  addJsonObject: (rawText: string) => {
    const id = crypto.randomUUID();
    let parsedData: unknown | null = null;
    let error: string | null = null;

    // 빈 문자열이나 공백만 있는 경우 파싱 시도하지 않음
    const trimmedText = rawText.trim();
    if (trimmedText !== "") {
      try {
        parsedData = JSON.parse(rawText);
      } catch (e) {
        error = e instanceof Error ? e.message : "Invalid JSON";
      }
    }

    set((state) => ({
      jsonObjects: [...state.jsonObjects, { id, rawText, parsedData, error }],
    }));
  },

  removeJsonObject: (id: string) => {
    set((state) => {
      const newInterfaces = { ...state.typescriptInterfaces };
      delete newInterfaces[id];
      return {
        jsonObjects: state.jsonObjects.filter((obj) => obj.id !== id),
        typescriptInterfaces: newInterfaces,
      };
    });
  },

  updateJsonObject: (id: string, rawText: string) => {
    let parsedData: unknown | null = null;
    let error: string | null = null;

    // 빈 문자열이나 공백만 있는 경우 파싱 시도하지 않음
    const trimmedText = rawText.trim();
    if (trimmedText === "") {
      set((state) => ({
        jsonObjects: state.jsonObjects.map((obj) =>
          obj.id === id
            ? { ...obj, rawText, parsedData: null, error: null }
            : obj
        ),
      }));
      return;
    }

    try {
      parsedData = JSON.parse(rawText);
    } catch (e) {
      error = e instanceof Error ? e.message : "Invalid JSON";
    }

    set((state) => ({
      jsonObjects: state.jsonObjects.map((obj) =>
        obj.id === id ? { ...obj, rawText, parsedData, error } : obj
      ),
    }));
  },

  setSearchQuery: (query: string) => {
    set({ searchQuery: query });
  },

  performSearch: () => {
    const { jsonObjects, searchQuery } = get();

    if (!searchQuery.trim()) {
      set({ searchResults: [] });
      return;
    }

    const query = searchQuery.toLowerCase();
    const results: SearchResult[] = [];

    const searchRecursive = (
      data: unknown,
      inputId: string,
      path: string
    ): void => {
      if (data === null || data === undefined) return;

      if (typeof data === "object" && !Array.isArray(data) && data !== null) {
        // 객체인 경우
        for (const [objKey, objValue] of Object.entries(data)) {
          const currentPath = path ? `${path}.${objKey}` : objKey;

          // 키 매칭 여부
          const keyMatches = objKey.toLowerCase().includes(query);
          // 값 매칭 여부 (원시값만: 문자열, 숫자, boolean, null)
          const valueMatches =
            typeof objValue !== "object" &&
            objValue !== undefined &&
            String(objValue).toLowerCase().includes(query);

          // 키 또는 값 중 하나라도 매칭되면 하나의 결과만 추가
          if (keyMatches || valueMatches) {
            results.push({
              inputId,
              path: currentPath,
              key: objKey,
              value: objValue,
              matchedField: keyMatches ? "key" : "value",
            });
          }

          // 원시값(문자열, 숫자, boolean 등)은 더 이상 재귀할 필요 없음
          if (typeof objValue === "object" && objValue !== null) {
            searchRecursive(objValue, inputId, currentPath);
          }
        }
      } else if (Array.isArray(data)) {
        // 배열인 경우
        data.forEach((item, index) => {
          const currentPath = `${path}[${index}]`;

          // 값 매칭 (원시값만: 문자열, 숫자, boolean, null)
          if (
            typeof item !== "object" &&
            item !== undefined &&
            String(item).toLowerCase().includes(query)
          ) {
            results.push({
              inputId,
              path: currentPath,
              key: index,
              value: item,
              matchedField: "value",
            });
          }

          // 원시값은 더 이상 재귀할 필요 없음
          if (typeof item === "object" && item !== null) {
            searchRecursive(item, inputId, currentPath);
          }
        });
      }
    };

    jsonObjects.forEach((jsonObj) => {
      if (jsonObj.parsedData && !jsonObj.error) {
        searchRecursive(jsonObj.parsedData, jsonObj.id, "");
      }
    });

    set({ searchResults: results });
  },

  clearSearch: () => {
    set({ searchQuery: "", searchResults: [] });
  },

  setSearchMode: (mode: "global" | "individual") => {
    set({ searchMode: mode });
    // 모드 변경 시 검색 결과 초기화
    if (mode === "global") {
      set({ individualSearchResults: {} });
    } else {
      set({ searchResults: [] });
    }
  },

  performIndividualSearch: (inputId: string, query: string) => {
    const { jsonObjects } = get();

    if (!query.trim()) {
      set((state) => {
        const newIndividualResults = { ...state.individualSearchResults };
        delete newIndividualResults[inputId];
        return { individualSearchResults: newIndividualResults };
      });
      return;
    }

    const searchQuery = query.toLowerCase();
    const results: SearchResult[] = [];

    const jsonObj = jsonObjects.find((obj) => obj.id === inputId);
    if (!jsonObj || !jsonObj.parsedData || jsonObj.error) {
      set((state) => {
        const newIndividualResults = { ...state.individualSearchResults };
        delete newIndividualResults[inputId];
        return { individualSearchResults: newIndividualResults };
      });
      return;
    }

    const searchRecursive = (data: unknown, path: string): void => {
      if (data === null || data === undefined) return;

      if (typeof data === "object" && !Array.isArray(data) && data !== null) {
        // 객체인 경우
        for (const [objKey, objValue] of Object.entries(data)) {
          const currentPath = path ? `${path}.${objKey}` : objKey;

          // 키 매칭 여부
          const keyMatches = objKey.toLowerCase().includes(searchQuery);
          // 값 매칭 여부 (원시값만: 문자열, 숫자, boolean, null)
          const valueMatches =
            typeof objValue !== "object" &&
            objValue !== undefined &&
            String(objValue).toLowerCase().includes(searchQuery);

          // 키 또는 값 중 하나라도 매칭되면 하나의 결과만 추가
          if (keyMatches || valueMatches) {
            results.push({
              inputId,
              path: currentPath,
              key: objKey,
              value: objValue,
              matchedField: keyMatches ? "key" : "value",
            });
          }

          // 원시값(문자열, 숫자, boolean 등)은 더 이상 재귀할 필요 없음
          if (typeof objValue === "object" && objValue !== null) {
            searchRecursive(objValue, currentPath);
          }
        }
      } else if (Array.isArray(data)) {
        // 배열인 경우
        data.forEach((item, index) => {
          const currentPath = `${path}[${index}]`;

          // 값 매칭 (원시값만: 문자열, 숫자, boolean, null)
          if (
            typeof item !== "object" &&
            item !== undefined &&
            String(item).toLowerCase().includes(searchQuery)
          ) {
            results.push({
              inputId,
              path: currentPath,
              key: index,
              value: item,
              matchedField: "value",
            });
          }

          // 원시값은 더 이상 재귀할 필요 없음
          if (typeof item === "object" && item !== null) {
            searchRecursive(item, currentPath);
          }
        });
      }
    };

    searchRecursive(jsonObj.parsedData, "");

    set((state) => ({
      individualSearchResults: {
        ...state.individualSearchResults,
        [inputId]: results,
      },
    }));
  },

  clearIndividualSearch: (inputId: string) => {
    set((state) => {
      const newIndividualResults = { ...state.individualSearchResults };
      delete newIndividualResults[inputId];
      return { individualSearchResults: newIndividualResults };
    });
  },

  setIndentDepth: (depth: number) => {
    // 1 이상 8 이하의 값만 허용
    const validDepth = Math.max(1, Math.min(8, Math.floor(depth)));
    set({ indentDepth: validDepth });
  },

  generateTypeScriptInterface: (inputId: string) => {
    const { jsonObjects } = get();
    const jsonObj = jsonObjects.find((obj) => obj.id === inputId);

    if (!jsonObj) {
      set((state) => ({
        typescriptInterfaces: {
          ...state.typescriptInterfaces,
          [inputId]: { interfaceString: null, error: "JSON 객체를 찾을 수 없습니다." },
        },
      }));
      return;
    }

    if (jsonObj.error || !jsonObj.parsedData) {
      set((state) => ({
        typescriptInterfaces: {
          ...state.typescriptInterfaces,
          [inputId]: {
            interfaceString: null,
            error: jsonObj.error || "유효한 JSON 데이터가 없습니다.",
          },
        },
      }));
      return;
    }

    try {
      const interfaceString = jsonToInterface(jsonObj.parsedData, "Root");
      set((state) => ({
        typescriptInterfaces: {
          ...state.typescriptInterfaces,
          [inputId]: { interfaceString, error: null },
        },
      }));
    } catch (error) {
      set((state) => ({
        typescriptInterfaces: {
          ...state.typescriptInterfaces,
          [inputId]: {
            interfaceString: null,
            error: error instanceof Error ? error.message : "인터페이스 생성 중 오류가 발생했습니다.",
          },
        },
      }));
    }
  },
}));
