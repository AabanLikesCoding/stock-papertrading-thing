'use client';

import Portfolio from '../components/Portfolio';
import MarketOverview from '../components/MarketOverview';
import TransactionHistory from '../components/TransactionHistory';

export default function Dashboard() {
  return (
    <div className="space-y-8 animate-fade-in">
      <h1 className="text-3xl font-bold text-white mb-8 transition-all hover:scale-105">Dashboard</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <Portfolio />
          <TransactionHistory />
        </div>

        <div className="space-y-8">
          <MarketOverview />
        </div>
      </div>
    </div>
  );
} 