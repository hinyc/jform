'use client';

import { useEffect } from 'react';
import { JsonInputArea } from './components/json-formatter/JsonInputArea';
import { JsonResultArea } from './components/json-formatter/JsonResultArea';
import { loadJsonFromUrl } from './components/json-formatter/ShareButton';
import { useJsonFormatterStore } from '@/lib/stores/jsonFormatterStore';

export default function Home() {
  const addJsonObject = useJsonFormatterStore((state) => state.addJsonObject);
  const jsonObjects = useJsonFormatterStore((state) => state.jsonObjects);

  useEffect(() => {
    const urlData = loadJsonFromUrl();
    if (urlData.length > 0 && jsonObjects.length === 0) {
      urlData.forEach((rawText) => {
        if (rawText.trim()) {
          addJsonObject(rawText);
        }
      });
    }
  }, [addJsonObject, jsonObjects.length]);

  return (
    <div className="flex min-h-screen bg-zinc-50 font-sans dark:bg-black">
      <main className="flex w-full flex-row gap-6 p-6 overflow-x-auto">
        <div className="flex-shrink-0" style={{ minWidth: '200px', maxWidth: '40vw', width: '40%' }}>
          <JsonInputArea />
        </div>
        <div className="flex-shrink-0" style={{ minWidth: '400px', maxWidth: '60vw', width: '60%' }}>
          <JsonResultArea />
        </div>
      </main>
    </div>
  );
}
