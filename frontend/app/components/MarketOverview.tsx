'use client';

import { useState, useEffect } from 'react';

interface MarketStock {
  symbol: string;
  price: number;
  change: number;
  name: string;
}

export default function MarketOverview() {
  const [stocks, setStocks] = useState<MarketStock[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Use fewer stocks for faster loading
  const popularStocks = ['AAPL', 'MSFT'];

  useEffect(() => {
    const fetchStocks = async () => {
      try {
        console.log('Fetching market overview stocks...');
        
        // Try direct API call to debug
        const testResponse = await fetch('/stock/AAPL');
        console.log(`Direct API test response status: ${testResponse.status}`);
        if (testResponse.ok) {
          const testData = await testResponse.json();
          console.log('Test data received:', testData);
        } else {
          console.error('Direct API test failed:', testResponse.statusText);
        }
        
        // Attempt to fetch each stock individually
        let successfulFetches = 0;
        const stockResults = [];
        
        for (const symbol of popularStocks) {
          try {
            console.log(`Fetching ${symbol}...`);
            const response = await fetch(`/stock/${symbol}`);
            console.log(`Response for ${symbol}: ${response.status}`);
            
            if (response.ok) {
              const data = await response.json();
              console.log(`Data for ${symbol}:`, data);
              stockResults.push(data);
              successfulFetches++;
            }
          } catch (err) {
            console.error(`Error fetching ${symbol}:`, err);
          }
        }
        
        if (successfulFetches === 0) {
          setError('Could not load any stock data');
        } else {
          setStocks(stockResults);
          setError(null);
        }
      } catch (err) {
        console.error('Error fetching market overview:', err);
        setError('Failed to load market data');
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
          {[...Array(2)].map((_, i) => (
            <div key={i} className="h-12 bg-zinc-800 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-black p-4 rounded-lg border border-red-800 text-red-400">
        <h3 className="text-lg font-semibold mb-4">Market Overview</h3>
        <p>{error}</p>
        <button 
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 bg-zinc-900 text-white rounded border border-zinc-800 hover:bg-zinc-800 hover:border-white"
        >
          Retry
        </button>
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
                {stock.change >= 0 ? '+' : ''}{stock.change.toFixed(2)}%
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 