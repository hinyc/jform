'use client';

import { useState, useEffect } from 'react';
import { Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useJsonFormatterStore } from '@/lib/stores/jsonFormatterStore';

interface JsonInputCardProps {
  id: string;
  initialValue?: string;
  onRemove?: () => void;
}

export function JsonInputCard({ id, initialValue = '', onRemove }: JsonInputCardProps) {
  const [localValue, setLocalValue] = useState(initialValue);
  const updateJsonObject = useJsonFormatterStore((state) => state.updateJsonObject);

  useEffect(() => {
    if (initialValue !== localValue) {
      setLocalValue(initialValue);
    }
  }, [initialValue]);

  const handleChange = (value: string) => {
    setLocalValue(value);
    updateJsonObject(id, value);
  };

  const handleRemove = () => {
    if (onRemove) {
      onRemove();
    }
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">JSON Input</CardTitle>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={handleRemove}
          className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
        >
          <Trash2 className="size-4" />
        </Button>
      </CardHeader>
      <CardContent className="flex-1 p-4 pt-0 overflow-hidden">
        <textarea
          value={localValue}
          onChange={(e) => handleChange(e.target.value)}
          placeholder='예: { "name": "John", "age": 30 }'
          className="w-full h-full resize-none border rounded-md p-3 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-900 dark:border-gray-700 dark:text-gray-100"
        />
      </CardContent>
    </Card>
  );
}

