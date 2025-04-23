'use client';

import { useState, useEffect } from 'react';

interface MarketStock {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
}

export default function MarketOverview() {
  const [stocks, setStocks] = useState<MarketStock[]>([]);
  const [loading, setLoading] = useState(true);
  const popularStocks = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA'];
  
  useEffect(() => {
    const fetchStocks = async () => {
      try {
        const promises = popularStocks.map(symbol =>
          fetch(`/stock/${symbol}`).then(res => res.json())
        );
        const results = await Promise.all(promises);
        setStocks(results);
      } catch (err) {
        console.error('Error fetching market overview:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStocks();
    const interval = setInterval(fetchStocks, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="bg-black p-4 rounded-lg border border-zinc-800 animate-pulse">
        <div className="h-6 bg-zinc-800 rounded w-1/4 mb-4"></div>
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-12 bg-zinc-800 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-black p-4 rounded-lg border border-zinc-800 transition-all hover:border-zinc-600">
      <h3 className="text-lg font-semibold mb-4">Market Overview</h3>
      <div className="space-y-2">
        {stocks.map((stock) => (
          <div
            key={stock.symbol}
            className="flex items-center justify-between p-2 rounded hover:bg-zinc-900 transition-all"
          >
            <div>
              <span className="font-medium">{stock.symbol}</span>
            </div>
            <div className="flex items-center gap-4">
              <span>${stock.price.toFixed(2)}</span>
              <span className={`${stock.change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {stock.change >= 0 ? '+' : ''}{stock.changePercent.toFixed(2)}%
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 