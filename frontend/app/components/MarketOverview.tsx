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
  // Use the most popular stocks
  const popularStocks = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA'];

  useEffect(() => {
    async function fetchStock(symbol: string) {
      try {
        console.log(`Fetching ${symbol}...`);
        const response = await fetch(`/stock/${symbol}`);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch ${symbol}: ${response.status}`);
        }
        
        const data = await response.json();
        console.log(`Data for ${symbol}:`, data);
        return data;
      } catch (error) {
        console.error(`Error fetching ${symbol}:`, error);
        return null;
      }
    }

    async function fetchAllStocks() {
      setLoading(true);
      setError(null);
      
      try {
        console.log('Starting to fetch stock data...');
        
        const stockData = [];
        // Fetch one stock at a time to avoid overwhelming the API
        for (const symbol of popularStocks) {
          const data = await fetchStock(symbol);
          if (data) {
            stockData.push(data);
          }
        }
        
        console.log('Fetched stocks:', stockData);
        
        if (stockData.length === 0) {
          setError('Could not load any stock data');
        } else {
          setStocks(stockData);
        }
      } catch (err) {
        console.error('Error in fetchAllStocks:', err);
        setError('Failed to load market data');
      } finally {
        setLoading(false);
      }
    }

    fetchAllStocks();
    
    // Refresh every 30 seconds
    const interval = setInterval(() => {
      fetchAllStocks();
    }, 30000);
    
    return () => clearInterval(interval);
  }, []);
  
  const handleRetry = () => {
    setLoading(true);
    setError(null);
    
    // Force component to refetch data
    setTimeout(() => {
      window.location.reload();
    }, 100);
  };

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

  if (error) {
    return (
      <div className="bg-black p-4 rounded-lg border border-red-800 text-red-400">
        <h3 className="text-lg font-semibold mb-4">Market Overview</h3>
        <p>{error}</p>
        <button 
          onClick={handleRetry}
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