import { NextRequest, NextResponse } from 'next/server';

// Mock stock data for demonstration
const stocks = [
  {
    symbol: 'AAPL',
    name: 'Apple Inc.',
    price: 175.34,
    change: 1.35,
  },
  {
    symbol: 'MSFT',
    name: 'Microsoft Corporation',
    price: 342.78,
    change: -0.36,
  },
  {
    symbol: 'GOOGL',
    name: 'Alphabet Inc.',
    price: 137.65,
    change: 0.64,
  },
  {
    symbol: 'AMZN',
    name: 'Amazon.com Inc.',
    price: 176.23,
    change: 2.0,
  },
  {
    symbol: 'TSLA',
    name: 'Tesla Inc.',
    price: 230.56,
    change: -2.4,
  }
];

// Add some price randomization to simulate live data
function getStockWithRandomPrice(stock: typeof stocks[0]) {
  // Random fluctuation between -3% and +3%
  const randomFactor = 1 + (Math.random() * 0.06 - 0.03);
  const updatedPrice = stock.price * randomFactor;
  
  // Calculate the percent change from the original price
  const percentChange = ((updatedPrice / stock.price) - 1) * 100;
  
  return {
    ...stock,
    price: updatedPrice,
    change: percentChange
  };
}

export async function GET(
  request: NextRequest,
  { params }: { params: { symbol: string } }
) {
  const symbol = params.symbol.toUpperCase();
  
  const stock = stocks.find(s => s.symbol === symbol);
  
  if (!stock) {
    return NextResponse.json({ error: 'Stock not found' }, { status: 404 });
  }
  
  // Return the stock with a slight random price variation
  return NextResponse.json(getStockWithRandomPrice(stock));
} 