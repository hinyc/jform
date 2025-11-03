'use client';

import { useState } from 'react';
import { Share2, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useJsonFormatterStore } from '@/lib/stores/jsonFormatterStore';

function encodeJsonToUrl(jsonObjects: Array<{ rawText: string }>): string {
  try {
    const data = jsonObjects.map((obj) => obj.rawText);
    const jsonString = JSON.stringify(data);
    const base64 = btoa(encodeURIComponent(jsonString));
    return base64;
  } catch (error) {
    console.error('Encoding error:', error);
    return '';
  }
}

function decodeJsonFromUrl(encoded: string): string[] {
  try {
    const jsonString = decodeURIComponent(atob(encoded));
    const data = JSON.parse(jsonString);
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error('Decoding error:', error);
    return [];
  }
}

export function ShareButton() {
  const [copied, setCopied] = useState(false);
  const jsonObjects = useJsonFormatterStore((state) => state.jsonObjects);

  const handleShare = async () => {
    if (jsonObjects.length === 0) {
      alert('공유할 JSON 객체가 없습니다.');
      return;
    }

    const encoded = encodeJsonToUrl(jsonObjects);
    const url = `${window.location.origin}${window.location.pathname}?data=${encoded}`;

    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
      alert('URL 복사에 실패했습니다.');
    }
  };

  return (
    <Button onClick={handleShare} variant="outline" size="sm">
      {copied ? (
        <>
          <Check className="size-4 mr-1" />
          복사됨
        </>
      ) : (
        <>
          <Share2 className="size-4 mr-1" />
          공유
        </>
      )}
    </Button>
  );
}

export function loadJsonFromUrl(): string[] {
  if (typeof window === 'undefined') return [];

  const params = new URLSearchParams(window.location.search);
  const dataParam = params.get('data');

  if (!dataParam) return [];

  return decodeJsonFromUrl(dataParam);
}

