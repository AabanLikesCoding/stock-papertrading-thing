'use client';

import { useEffect, useState } from 'react';

interface Position {
  symbol: string;
  quantity: number;
  averagePrice: number;
  currentPrice: number;
  totalValue: number;
  profitLoss: number;
}

interface SellModalProps {
  position: Position;
  onClose: () => void;
  onSell: (quantity: number) => void;
  maxQuantity: number;
}

const SellModal = ({ position, onClose, onSell, maxQuantity }: SellModalProps) => {
  const [quantity, setQuantity] = useState('1');
  const [error, setError] = useState('');

  const handleSell = () => {
    const amount = Number(quantity);
    if (amount <= 0 || amount > maxQuantity) {
      setError('Invalid quantity');
      return;
    }
    onSell(amount);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-fade-in">
      <div className="bg-black p-8 rounded-lg border border-zinc-800 w-full max-w-md transform transition-all">
        <h2 className="text-2xl font-bold mb-4">Sell {position.symbol}</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-zinc-400 mb-2">Current Price</label>
            <p className="text-xl">${position.currentPrice.toFixed(2)}</p>
          </div>
          <div>
            <label className="block text-zinc-400 mb-2">Quantity (Max: {maxQuantity})</label>
            <input
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              min="1"
              max={maxQuantity}
              className="w-full p-3 rounded bg-black text-white border border-zinc-800
                       focus:outline-none focus:border-white transition-all duration-200
                       hover:border-zinc-600"
            />
          </div>
          {error && <p className="text-red-400">{error}</p>}
          <div className="flex gap-4">
            <button
              onClick={handleSell}
              className="flex-1 px-6 py-3 bg-zinc-900 text-white rounded
                       hover:bg-zinc-800 transition-all duration-200
                       transform hover:scale-105 border border-zinc-800 hover:border-white"
            >
              Sell
            </button>
            <button
              onClick={onClose}
              className="flex-1 px-6 py-3 bg-black text-white rounded
                       hover:bg-zinc-900 transition-all duration-200
                       border border-zinc-800 hover:border-white"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function Portfolio() {
  const [cash, setCash] = useState(10000);
  const [positions, setPositions] = useState<Position[]>([]);
  const [totalValue, setTotalValue] = useState(0);
  const [selectedPosition, setSelectedPosition] = useState<Position | null>(null);
  const [successMessage, setSuccessMessage] = useState('');

  const fetchPortfolio = () => {
    fetch('http://localhost:8000/my-portfolio/1')
      .then(res => res.json())
      .then(data => {
        setCash(data.cash);
        setPositions(data.positions);
      })
      .catch(err => console.error('Error fetching portfolio:', err));
  };

  useEffect(() => {
    fetchPortfolio();
  }, []);

  useEffect(() => {
    const positionsValue = positions.reduce((sum, pos) => sum + pos.totalValue, 0);
    setTotalValue(cash + positionsValue);
  }, [cash, positions]);

  const handleSell = async (quantity: number) => {
    if (!selectedPosition) return;

    try {
      const response = await fetch('http://localhost:8000/trade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: 1,
          symbol: selectedPosition.symbol,
          quantity: quantity,
          action: 'sell'
        }),
      });

      if (!response.ok) throw new Error('Trade failed');

      setSuccessMessage(`Successfully sold ${quantity} shares of ${selectedPosition.symbol}`);
      setSelectedPosition(null);
      fetchPortfolio();

      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      console.error('Error selling shares:', err);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <h1 className="text-3xl font-bold text-white mb-8 transition-all hover:scale-105">Portfolio Overview</h1>

      {successMessage && (
        <div className="p-4 bg-black border border-green-500 rounded text-green-400
                      transform transition-all duration-300 animate-slide-in">
          {successMessage}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-black p-6 rounded-lg border border-zinc-800 transition-all hover:border-zinc-600">
          <h3 className="text-lg text-zinc-400">Available Cash</h3>
          <p className="text-2xl text-white">${cash.toLocaleString()}</p>
        </div>
        
        <div className="bg-black p-6 rounded-lg border border-zinc-800 transition-all hover:border-zinc-600">
          <h3 className="text-lg text-zinc-400">Portfolio Value</h3>
          <p className="text-2xl text-white">${totalValue.toLocaleString()}</p>
        </div>

        <div className="bg-black p-6 rounded-lg border border-zinc-800 transition-all hover:border-zinc-600">
          <h3 className="text-lg text-zinc-400">Total Return</h3>
          <p className={`text-2xl ${totalValue > 10000 ? 'text-green-400' : totalValue < 10000 ? 'text-red-400' : 'text-white'}`}>
            {((totalValue - 10000) / 100).toFixed(2)}%
          </p>
        </div>
      </div>

      <div className="bg-black rounded-lg p-8 border border-zinc-800 transition-all hover:border-zinc-600">
        <h2 className="text-xl font-bold text-white mb-6">Current Positions</h2>
        {positions.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-zinc-400 border-b border-zinc-800">
                  <th className="pb-4">Symbol</th>
                  <th className="pb-4">Shares</th>
                  <th className="pb-4">Avg Price</th>
                  <th className="pb-4">Current Price</th>
                  <th className="pb-4">Total Value</th>
                  <th className="pb-4">P/L</th>
                  <th className="pb-4">Action</th>
                </tr>
              </thead>
              <tbody>
                {positions.map((position) => (
                  <tr key={position.symbol} className="border-b border-zinc-800 transition-all hover:bg-zinc-900">
                    <td className="py-4 text-white">{position.symbol}</td>
                    <td className="py-4">{position.quantity}</td>
                    <td className="py-4">${position.averagePrice.toFixed(2)}</td>
                    <td className="py-4">${position.currentPrice.toFixed(2)}</td>
                    <td className="py-4">${position.totalValue.toLocaleString()}</td>
                    <td className={`py-4 ${position.profitLoss >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {position.profitLoss >= 0 ? '+' : ''}{position.profitLoss.toFixed(2)}%
                    </td>
                    <td className="py-4">
                      <button
                        onClick={() => setSelectedPosition(position)}
                        className="px-4 py-2 bg-zinc-900 text-white rounded
                                 hover:bg-zinc-800 transition-all duration-200
                                 transform hover:scale-105 border border-zinc-800 hover:border-white"
                      >
                        Sell
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-zinc-400 text-center py-4">
            No positions yet. Start trading to build your portfolio.
          </p>
        )}
      </div>

      {selectedPosition && (
        <SellModal
          position={selectedPosition}
          onClose={() => setSelectedPosition(null)}
          onSell={handleSell}
          maxQuantity={selectedPosition.quantity}
        />
      )}
    </div>
  );
} 