'use client';

import { useState, useEffect } from 'react';

interface Transaction {
  id: number;
  userId: string;
  symbol: string;
  quantity: number;
  price: number;
  type: 'BUY' | 'SELL';
  totalAmount: number;
  timestamp: string;
}

export default function TransactionHistory() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const userId = '1'; // Default user ID

  async function fetchTransactions() {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/transactions?userId=${userId}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch transactions: ${response.status}`);
      }
      
      const data = await response.json();
      setTransactions(data);
    } catch (err) {
      console.error('Error fetching transactions:', err);
      setError('Failed to load transaction history');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchTransactions();
    
    // Refresh every 30 seconds
    const interval = setInterval(() => {
      fetchTransactions();
    }, 30000);
    
    return () => clearInterval(interval);
  }, [userId]);
  
  const handleRefresh = () => {
    fetchTransactions();
  };
  
  return (
    <div className="bg-black p-4 rounded-lg border border-zinc-800 transition-all hover:border-zinc-600">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Transaction History</h3>
        <button 
          onClick={handleRefresh}
          disabled={loading}
          className="p-1.5 rounded hover:bg-zinc-800 transition-colors"
          title="Refresh"
        >
          <span className={`inline-block ${loading ? 'animate-spin' : ''}`}>⟳</span>
        </button>
      </div>
      
      {loading && transactions.length === 0 ? (
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-12 bg-zinc-800/50 animate-pulse rounded"></div>
          ))}
        </div>
      ) : error ? (
        <p className="text-red-400">{error}</p>
      ) : transactions.length === 0 ? (
        <p className="text-zinc-400">No transaction history yet.</p>
      ) : (
        <div className="space-y-2">
          {loading && (
            <div className="absolute inset-0 bg-black/20 flex items-center justify-center rounded">
              <span className="animate-spin text-white/50">⟳</span>
            </div>
          )}
          {transactions.map((transaction) => (
            <div
              key={transaction.id}
              className="flex items-center justify-between p-2 rounded hover:bg-zinc-900 transition-all"
            >
              <div>
                <span className={`px-2 py-0.5 text-xs rounded mr-2 ${
                  transaction.type === 'BUY' 
                    ? 'bg-green-900/50 text-green-300' 
                    : 'bg-red-900/50 text-red-300'
                }`}>
                  {transaction.type}
                </span>
                <span className="font-medium">{transaction.symbol}</span>
                <div className="text-xs text-zinc-400">
                  {new Date(transaction.timestamp).toLocaleString()}
                </div>
              </div>
              <div className="text-right">
                <div>{transaction.quantity} @ ${transaction.price.toFixed(2)}</div>
                <div className="text-xs text-zinc-400">
                  Total: ${transaction.totalAmount.toFixed(2)}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 