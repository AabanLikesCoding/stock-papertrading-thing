'use client';

import { useState, useEffect } from 'react';

interface SearchHistoryProps {
  onSelect: (symbol: string) => void;
}

export default function SearchHistory({ onSelect }: SearchHistoryProps) {
  const [history, setHistory] = useState<string[]>([]);

  useEffect(() => {
    const savedHistory = localStorage.getItem('searchHistory');
    if (savedHistory) {
      setHistory(JSON.parse(savedHistory));
    }
  }, []);

  const addToHistory = (symbol: string) => {
    const newHistory = [symbol, ...history.filter(s => s !== symbol)].slice(0, 5);
    setHistory(newHistory);
    localStorage.setItem('searchHistory', JSON.stringify(newHistory));
  };

  return (
    <div className="bg-black p-4 rounded-lg border border-zinc-800 transition-all hover:border-zinc-600">
      <h3 className="text-lg font-semibold mb-4">Recent Searches</h3>
      {history.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {history.map((symbol) => (
            <button
              key={symbol}
              onClick={() => {
                onSelect(symbol);
                addToHistory(symbol);
              }}
              className="px-3 py-1 bg-zinc-900 rounded text-sm hover:bg-zinc-800
                       transition-all duration-200 transform hover:scale-105
                       border border-zinc-800 hover:border-white"
            >
              {symbol}
            </button>
          ))}
        </div>
      ) : (
        <p className="text-zinc-400 text-sm">Your recent searches will appear here</p>
      )}
    </div>
  );
} 