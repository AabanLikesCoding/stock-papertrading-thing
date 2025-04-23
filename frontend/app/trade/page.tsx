'use client';

import { useState } from 'react';
import MarketOverview from '../components/MarketOverview';
import SearchHistory from '../components/SearchHistory';
import PriceAlert from '../components/PriceAlert';

interface StockData {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
}

export default function Trade() {
  const [searchQuery, setSearchQuery] = useState('');
  const [stockData, setStockData] = useState<StockData | null>(null);
  const [quantity, setQuantity] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  
  // Use direct paths for API calls
  const searchStock = async (symbol: string = searchQuery) => {
    if (!symbol) return;
    
    setLoading(true);
    setError('');
    setStockData(null);
    setSearchQuery(symbol);
    
    try {
      const response = await fetch(`/stock/${symbol}`);
      if (!response.ok) throw new Error('Stock not found');
      setStockData(await response.json());
    } catch (err) {
      setError('Failed to fetch stock data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleTrade = async (action: 'buy' | 'sell') => {
    if (!stockData || !quantity) return;
    
    try {
      const response = await fetch(`/trade`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: 1,
          symbol: stockData.symbol,
          quantity: parseInt(quantity),
          action: action,
        }),
      });

      if (!response.ok) throw new Error('Trade failed');
      
      const result = await response.json();
      setSuccessMessage(`Successfully ${action}ed ${quantity} shares of ${stockData.symbol}`);
      setQuantity('');
      searchStock(stockData.symbol);

      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setError('Trade failed. Please try again.');
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <h1 className="text-3xl font-bold text-white mb-8 transition-all hover:scale-105">Trade Stocks</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="flex gap-4 transition-all hover:scale-[1.01]">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Enter stock symbol (e.g., AAPL)"
              className="flex-grow p-3 rounded bg-black text-white border border-zinc-800 
                       focus:outline-none focus:border-white transition-all duration-200
                       hover:border-zinc-600"
            />
            <button
              onClick={() => searchStock()}
              disabled={loading}
              className="px-8 py-3 bg-zinc-900 text-white rounded border border-zinc-800
                       hover:bg-zinc-800 hover:border-white disabled:opacity-50 
                       transition-all duration-200 transform hover:scale-105"
            >
              {loading ? 'Searching...' : 'Search'}
            </button>
          </div>

          <SearchHistory onSelect={searchStock} />

          {error && (
            <div className="p-4 bg-black border border-red-500 rounded text-red-400
                          transform transition-all duration-300 animate-slide-in">
              {error}
            </div>
          )}

          {successMessage && (
            <div className="p-4 bg-black border border-green-500 rounded text-green-400
                          transform transition-all duration-300 animate-slide-in">
              {successMessage}
            </div>
          )}

          {stockData && (
            <div className="bg-black rounded-lg p-8 space-y-8 border border-zinc-800
                          transform transition-all duration-300 hover:border-zinc-600
                          animate-fade-in">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="transition-all hover:scale-105">
                  <h3 className="text-zinc-400">Symbol</h3>
                  <p className="text-xl text-white mt-1">{stockData.symbol}</p>
                </div>
                <div className="transition-all hover:scale-105">
                  <h3 className="text-zinc-400">Name</h3>
                  <p className="text-xl text-white mt-1">{stockData.name}</p>
                </div>
                <div className="transition-all hover:scale-105">
                  <h3 className="text-zinc-400">Price</h3>
                  <p className="text-xl text-white mt-1">${stockData.price.toFixed(2)}</p>
                </div>
                <div className="transition-all hover:scale-105">
                  <h3 className="text-zinc-400">Change</h3>
                  <p className={`text-xl mt-1 ${stockData.change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {stockData.change >= 0 ? '+' : ''}{stockData.change.toFixed(2)} 
                    <span className="text-sm ml-1">({stockData.changePercent.toFixed(2)}%)</span>
                  </p>
                </div>
              </div>

              <div className="flex flex-col md:flex-row gap-6 items-end">
                <div className="w-full md:w-1/3">
                  <label className="block text-zinc-400 mb-2">Quantity</label>
                  <input
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    min="1"
                    className="w-full p-3 rounded bg-black text-white border border-zinc-800
                             focus:outline-none focus:border-white transition-all duration-200
                             hover:border-zinc-600"
                    placeholder="Enter quantity"
                  />
                </div>
                <div className="flex gap-4 w-full md:w-auto">
                  <button
                    onClick={() => handleTrade('buy')}
                    disabled={!quantity}
                    className="flex-1 md:flex-none px-8 py-3 bg-zinc-900 text-white rounded
                             hover:bg-zinc-800 disabled:opacity-50 transition-all duration-200
                             transform hover:scale-105 border border-zinc-800 hover:border-white"
                  >
                    Buy
                  </button>
                  <button
                    onClick={() => handleTrade('sell')}
                    disabled={!quantity}
                    className="flex-1 md:flex-none px-8 py-3 bg-zinc-900 text-white rounded
                             hover:bg-zinc-800 disabled:opacity-50 transition-all duration-200
                             transform hover:scale-105 border border-zinc-800 hover:border-white"
                  >
                    Sell
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-8">
          <MarketOverview />
          <PriceAlert />
        </div>
      </div>
    </div>
  );
} 