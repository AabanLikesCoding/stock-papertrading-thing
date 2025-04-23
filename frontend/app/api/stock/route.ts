import { NextRequest, NextResponse } from 'next/server';

// Mock stock data
const stocks = [
  {
    symbol: 'AAPL',
    companyName: 'Apple Inc.',
    price: 175.34,
    change: 2.34,
    changePercent: 1.35,
  },
  {
    symbol: 'MSFT',
    companyName: 'Microsoft Corporation',
    price: 342.78,
    change: -1.23,
    changePercent: -0.36,
  },
  {
    symbol: 'GOOGL',
    companyName: 'Alphabet Inc.',
    price: 137.65,
    change: 0.87,
    changePercent: 0.64,
  },
  {
    symbol: 'AMZN',
    companyName: 'Amazon.com Inc.',
    price: 176.23,
    change: 3.45,
    changePercent: 2.0,
  },
  {
    symbol: 'TSLA',
    companyName: 'Tesla Inc.',
    price: 230.56,
    change: -5.67,
    changePercent: -2.4,
  }
];

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const symbol = searchParams.get('symbol');
  
  if (symbol) {
    const stock = stocks.find(s => s.symbol.toLowerCase() === symbol.toLowerCase());
    if (stock) {
      return NextResponse.json(stock);
    }
    return NextResponse.json({ error: 'Stock not found' }, { status: 404 });
  }
  
  return NextResponse.json(stocks);
} 