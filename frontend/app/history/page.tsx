'use client';

import { useEffect, useState } from 'react';

interface TradeHistory {
  id: number;
  symbol: string;
  action: 'buy' | 'sell';
  quantity: number;
  price: number;
  timestamp: string;
  total: number;
}

export default function History() {
  const [trades, setTrades] = useState<TradeHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    console.log('Fetching trade history...');
    fetch('/trade-history/1')
      .then(res => {
        console.log(`Trade history response status: ${res.status}`);
        if (!res.ok) {
          throw new Error(`Error status: ${res.status}`);
        }
        return res.json();
      })
      .then(data => {
        console.log('Received trade history:', data);
        setTrades(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching trade history:', err);
        setError(`Failed to load trade history: ${err.message}`);
        setLoading(false);
      });
  }, []);

  return (
    <div className="space-y-8 animate-fade-in">
      <h1 className="text-3xl font-bold text-white mb-8 transition-all hover:scale-105">Trading History</h1>

      {error && (
        <div className="p-4 bg-black border border-red-500 rounded text-red-400
                      transform transition-all duration-300 animate-slide-in">
          {error}
        </div>
      )}

      {loading ? (
        <div className="bg-black rounded-lg p-8 border border-zinc-800 animate-pulse">
          <div className="h-8 bg-zinc-800 rounded w-1/4 mb-8"></div>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-zinc-800 rounded"></div>
            ))}
          </div>
        </div>
      ) : trades.length > 0 ? (
        <div className="bg-black rounded-lg p-8 border border-zinc-800 transition-all hover:border-zinc-600">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-zinc-400 border-b border-zinc-800">
                  <th className="pb-4 font-medium">Date</th>
                  <th className="pb-4 font-medium">Symbol</th>
                  <th className="pb-4 font-medium">Action</th>
                  <th className="pb-4 font-medium">Quantity</th>
                  <th className="pb-4 font-medium">Price</th>
                  <th className="pb-4 font-medium">Total</th>
                </tr>
              </thead>
              <tbody>
                {trades.map((trade) => (
                  <tr key={trade.id} className="border-b border-zinc-800 transition-all hover:bg-zinc-900">
                    <td className="py-4 text-white">
                      {new Date(trade.timestamp).toLocaleDateString()}
                    </td>
                    <td className="py-4 text-white">{trade.symbol}</td>
                    <td className={`py-4 ${trade.action === 'buy' ? 'text-green-400' : 'text-red-400'}`}>
                      {trade.action.toUpperCase()}
                    </td>
                    <td className="py-4 text-white">{trade.quantity}</td>
                    <td className="py-4 text-white">${trade.price.toFixed(2)}</td>
                    <td className="py-4 text-white">${trade.total.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="text-center py-12 bg-black rounded-lg border border-zinc-800">
          <p className="text-zinc-400">No trading history available.</p>
          <a
            href="/trade"
            className="inline-block mt-4 px-6 py-3 bg-zinc-900 text-white rounded
                     hover:bg-zinc-800 transition-all duration-200 transform hover:scale-105
                     border border-zinc-800 hover:border-white"
          >
            Start Trading
          </a>
        </div>
      )}
    </div>
  );
} 