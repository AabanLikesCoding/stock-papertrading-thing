'use client';

import { useState, useEffect } from 'react';

interface Alert {
  symbol: string;
  targetPrice: number;
  type: 'above' | 'below';
  id: string;
}

export default function PriceAlert() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [symbol, setSymbol] = useState('');
  const [targetPrice, setTargetPrice] = useState('');
  const [alertType, setAlertType] = useState<'above' | 'below'>('above');
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    const savedAlerts = localStorage.getItem('priceAlerts');
    if (savedAlerts) {
      setAlerts(JSON.parse(savedAlerts));
    }
  }, []);

  const saveAlerts = (newAlerts: Alert[]) => {
    setAlerts(newAlerts);
    localStorage.setItem('priceAlerts', JSON.stringify(newAlerts));
  };

  const addAlert = () => {
    if (!symbol || !targetPrice) return;

    const newAlert: Alert = {
      symbol: symbol.toUpperCase(),
      targetPrice: Number(targetPrice),
      type: alertType,
      id: Date.now().toString()
    };

    saveAlerts([...alerts, newAlert]);
    setSymbol('');
    setTargetPrice('');
    setShowForm(false);
  };

  const removeAlert = (id: string) => {
    saveAlerts(alerts.filter(alert => alert.id !== id));
  };

  return (
    <div className="bg-black p-4 rounded-lg border border-zinc-800 transition-all hover:border-zinc-600">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Price Alerts</h3>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-3 py-1 bg-zinc-900 rounded text-sm hover:bg-zinc-800
                   transition-all duration-200 transform hover:scale-105
                   border border-zinc-800 hover:border-white"
        >
          {showForm ? 'Cancel' : 'Add Alert'}
        </button>
      </div>

      {showForm && (
        <div className="space-y-4 mb-4 p-4 bg-zinc-900/50 rounded">
          <div>
            <label className="block text-sm text-zinc-400 mb-1">Symbol</label>
            <input
              type="text"
              value={symbol}
              onChange={(e) => setSymbol(e.target.value)}
              className="w-full p-2 rounded bg-black text-white border border-zinc-800
                       focus:outline-none focus:border-white transition-all"
              placeholder="e.g., AAPL"
            />
          </div>
          <div>
            <label className="block text-sm text-zinc-400 mb-1">Target Price</label>
            <input
              type="number"
              value={targetPrice}
              onChange={(e) => setTargetPrice(e.target.value)}
              className="w-full p-2 rounded bg-black text-white border border-zinc-800
                       focus:outline-none focus:border-white transition-all"
              placeholder="e.g., 150.00"
            />
          </div>
          <div>
            <label className="block text-sm text-zinc-400 mb-1">Alert Type</label>
            <select
              value={alertType}
              onChange={(e) => setAlertType(e.target.value as 'above' | 'below')}
              className="w-full p-2 rounded bg-black text-white border border-zinc-800
                       focus:outline-none focus:border-white transition-all"
            >
              <option value="above">Price Goes Above</option>
              <option value="below">Price Goes Below</option>
            </select>
          </div>
          <button
            onClick={addAlert}
            className="w-full py-2 bg-zinc-800 rounded hover:bg-zinc-700
                     transition-all duration-200 transform hover:scale-105
                     border border-zinc-700 hover:border-white"
          >
            Set Alert
          </button>
        </div>
      )}

      <div className="space-y-2">
        {alerts.map((alert) => (
          <div
            key={alert.id}
            className="flex items-center justify-between p-2 rounded bg-zinc-900/50"
          >
            <div>
              <span className="font-medium">{alert.symbol}</span>
              <span className="text-zinc-400 ml-2">
                {alert.type === 'above' ? '↑' : '↓'} ${alert.targetPrice.toFixed(2)}
              </span>
            </div>
            <button
              onClick={() => removeAlert(alert.id)}
              className="text-zinc-400 hover:text-white transition-colors"
            >
              ×
            </button>
          </div>
        ))}
        {alerts.length === 0 && !showForm && (
          <p className="text-zinc-400 text-sm">No active price alerts</p>
        )}
      </div>
    </div>
  );
} 