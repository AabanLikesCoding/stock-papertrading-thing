'use client';

import { useState, useEffect } from 'react';

interface Holding {
  symbol: string;
  shares: number;
  avgPrice: number;
  currentValue: number;
}

interface PortfolioData {
  userId: string;
  cash: number;
  holdings: Holding[];
  totalHoldingsValue: number;
  totalPortfolioValue: number;
}

export default function Portfolio() {
  const [portfolio, setPortfolio] = useState<PortfolioData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const userId = '1'; // Default user ID

  useEffect(() => {
    async function fetchPortfolio() {
      setLoading(true);
      setError(null);
      
      try {
        const response = await fetch(`/api/portfolio?userId=${userId}`);
        if (!response.ok) {
          throw new Error(`Failed to fetch portfolio: ${response.status}`);
        }
        
        const data = await response.json();
        setPortfolio(data);
      } catch (err) {
        console.error('Error fetching portfolio:', err);
        setError('Failed to load portfolio data');
      } finally {
        setLoading(false);
      }
    }

    fetchPortfolio();
    
    // Refresh every 30 seconds
    const interval = setInterval(() => {
      fetchPortfolio();
    }, 30000);
    
    return () => clearInterval(interval);
  }, [userId]);
  
  if (loading) {
    return (
      <div className="bg-black p-4 rounded-lg border border-zinc-800 animate-pulse">
        <div className="h-6 bg-zinc-800 rounded w-1/4 mb-4"></div>
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-12 bg-zinc-800 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-black p-4 rounded-lg border border-red-800 text-red-400">
        <h3 className="text-lg font-semibold mb-4">My Portfolio</h3>
        <p>{error}</p>
      </div>
    );
  }

  if (!portfolio) {
    return (
      <div className="bg-black p-4 rounded-lg border border-zinc-800">
        <h3 className="text-lg font-semibold mb-4">My Portfolio</h3>
        <p className="text-zinc-400">No portfolio data available.</p>
      </div>
    );
  }

  return (
    <div className="bg-black p-4 rounded-lg border border-zinc-800 transition-all hover:border-zinc-600">
      <h3 className="text-lg font-semibold mb-4">My Portfolio</h3>
      
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-zinc-900 p-3 rounded">
          <div className="text-zinc-400 text-sm">Cash</div>
          <div className="text-xl font-semibold">${portfolio.cash.toFixed(2)}</div>
        </div>
        <div className="bg-zinc-900 p-3 rounded">
          <div className="text-zinc-400 text-sm">Total Value</div>
          <div className="text-xl font-semibold">${portfolio.totalPortfolioValue.toFixed(2)}</div>
        </div>
      </div>
      
      <h4 className="text-md font-medium mb-2">Holdings</h4>
      {portfolio.holdings.length === 0 ? (
        <p className="text-zinc-400 text-sm">No holdings yet. Start trading!</p>
      ) : (
        <div className="space-y-2">
          {portfolio.holdings.map((holding) => (
            <div
              key={holding.symbol}
              className="flex items-center justify-between p-2 rounded hover:bg-zinc-900 transition-all"
            >
              <div>
                <div className="font-medium">{holding.symbol}</div>
                <div className="text-xs text-zinc-400">{holding.shares} shares @ ${holding.avgPrice.toFixed(2)}</div>
              </div>
              <div className="text-right">
                <div>${holding.currentValue.toFixed(2)}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 