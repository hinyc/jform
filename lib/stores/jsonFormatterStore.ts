import { create } from 'zustand';
import type { JsonInput, SearchResult } from '../types/jsonFormatter';

interface JsonFormatterState {
  jsonObjects: JsonInput[];
  searchQuery: string;
  searchResults: SearchResult[];
  searchMode: 'global' | 'individual';
  individualSearchResults: Record<string, SearchResult[]>;
  
  addJsonObject: (rawText: string) => void;
  removeJsonObject: (id: string) => void;
  updateJsonObject: (id: string, rawText: string) => void;
  setSearchQuery: (query: string) => void;
  performSearch: () => void;
  clearSearch: () => void;
  setSearchMode: (mode: 'global' | 'individual') => void;
  performIndividualSearch: (inputId: string, query: string) => void;
  clearIndividualSearch: (inputId: string) => void;
}

export const useJsonFormatterStore = create<JsonFormatterState>((set, get) => ({
  jsonObjects: [],
  searchQuery: '',
  searchResults: [],
  searchMode: 'global',
  individualSearchResults: {},

  addJsonObject: (rawText: string) => {
    const id = crypto.randomUUID();
    let parsedData: unknown | null = null;
    let error: string | null = null;

    // 빈 문자열이나 공백만 있는 경우 파싱 시도하지 않음
    const trimmedText = rawText.trim();
    if (trimmedText !== '') {
      try {
        parsedData = JSON.parse(rawText);
      } catch (e) {
        error = e instanceof Error ? e.message : 'Invalid JSON';
      }
    }

    set((state) => ({
      jsonObjects: [
        ...state.jsonObjects,
        { id, rawText, parsedData, error },
      ],
    }));
  },

  removeJsonObject: (id: string) => {
    set((state) => ({
      jsonObjects: state.jsonObjects.filter((obj) => obj.id !== id),
    }));
  },

  updateJsonObject: (id: string, rawText: string) => {
    let parsedData: unknown | null = null;
    let error: string | null = null;

    // 빈 문자열이나 공백만 있는 경우 파싱 시도하지 않음
    const trimmedText = rawText.trim();
    if (trimmedText === '') {
      set((state) => ({
        jsonObjects: state.jsonObjects.map((obj) =>
          obj.id === id ? { ...obj, rawText, parsedData: null, error: null } : obj
        ),
      }));
      return;
    }

    try {
      parsedData = JSON.parse(rawText);
    } catch (e) {
      error = e instanceof Error ? e.message : 'Invalid JSON';
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
      path: string,
      key: string | number | null
    ): void => {
      if (data === null || data === undefined) return;

      if (typeof data === 'object' && !Array.isArray(data) && data !== null) {
        // 객체인 경우
        for (const [objKey, objValue] of Object.entries(data)) {
          const currentPath = path ? `${path}.${objKey}` : objKey;
          
          // 키 매칭
          if (objKey.toLowerCase().includes(query)) {
            results.push({
              inputId,
              path: currentPath,
              key: objKey,
              value: objValue,
              matchedField: 'key',
            });
          }
          
          // 값 매칭
          if (typeof objValue === 'string' && objValue.toLowerCase().includes(query)) {
            results.push({
              inputId,
              path: currentPath,
              key: objKey,
              value: objValue,
              matchedField: 'value',
            });
          }
          
          searchRecursive(objValue, inputId, currentPath, objKey);
        }
      } else if (Array.isArray(data)) {
        // 배열인 경우
        data.forEach((item, index) => {
          const currentPath = `${path}[${index}]`;
          
          // 값 매칭
          if (typeof item === 'string' && item.toLowerCase().includes(query)) {
            results.push({
              inputId,
              path: currentPath,
              key: index,
              value: item,
              matchedField: 'value',
            });
          }
          
          searchRecursive(item, inputId, currentPath, index);
        });
      } else {
        // 원시값인 경우
        const stringValue = String(data);
        if (stringValue.toLowerCase().includes(query)) {
          results.push({
            inputId,
            path,
            key,
            value: data,
            matchedField: 'value',
          });
        }
      }
    };

    jsonObjects.forEach((jsonObj) => {
      if (jsonObj.parsedData && !jsonObj.error) {
        searchRecursive(jsonObj.parsedData, jsonObj.id, '', null);
      }
    });

    set({ searchResults: results });
  },

  clearSearch: () => {
    set({ searchQuery: '', searchResults: [] });
  },

  setSearchMode: (mode: 'global' | 'individual') => {
    set({ searchMode: mode });
    // 모드 변경 시 검색 결과 초기화
    if (mode === 'global') {
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

    const searchRecursive = (
      data: unknown,
      path: string,
      key: string | number | null
    ): void => {
      if (data === null || data === undefined) return;

      if (typeof data === 'object' && !Array.isArray(data) && data !== null) {
        // 객체인 경우
        for (const [objKey, objValue] of Object.entries(data)) {
          const currentPath = path ? `${path}.${objKey}` : objKey;
          
          // 키 매칭
          if (objKey.toLowerCase().includes(searchQuery)) {
            results.push({
              inputId,
              path: currentPath,
              key: objKey,
              value: objValue,
              matchedField: 'key',
            });
          }
          
          // 값 매칭
          if (typeof objValue === 'string' && objValue.toLowerCase().includes(searchQuery)) {
            results.push({
              inputId,
              path: currentPath,
              key: objKey,
              value: objValue,
              matchedField: 'value',
            });
          }
          
          searchRecursive(objValue, currentPath, objKey);
        }
      } else if (Array.isArray(data)) {
        // 배열인 경우
        data.forEach((item, index) => {
          const currentPath = `${path}[${index}]`;
          
          // 값 매칭
          if (typeof item === 'string' && item.toLowerCase().includes(searchQuery)) {
            results.push({
              inputId,
              path: currentPath,
              key: index,
              value: item,
              matchedField: 'value',
            });
          }
          
          searchRecursive(item, currentPath, index);
        });
      } else {
        // 원시값인 경우
        const stringValue = String(data);
        if (stringValue.toLowerCase().includes(searchQuery)) {
          results.push({
            inputId,
            path,
            key,
            value: data,
            matchedField: 'value',
          });
        }
      }
    };

    searchRecursive(jsonObj.parsedData, '', null);

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
}));

