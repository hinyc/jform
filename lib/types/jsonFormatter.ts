export interface JsonInput {
  id: string;
  rawText: string;
  parsedData: unknown | null;
  error: string | null;
}

export interface JsonNode {
  key: string | number | null;
  value: unknown;
  type: 'object' | 'array' | 'primitive';
  path: string;
}

export interface SearchResult {
  inputId: string;
  path: string;
  key: string | number | null;
  value: unknown;
  matchedField: 'key' | 'value';
}

