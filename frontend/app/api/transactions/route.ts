import { NextRequest, NextResponse } from 'next/server';
import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

interface Transaction {
  id?: number;
  userId: string;
  symbol: string;
  quantity: number;
  price: number;
  type: 'BUY' | 'SELL';
  totalAmount: number;
  timestamp: string;
}

// Ensure data directory exists
const DATA_DIR = path.join(process.cwd(), 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const db = new Database(path.join(DATA_DIR, 'transactions.db'));

// Initialize the database
db.exec(`
  CREATE TABLE IF NOT EXISTS transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userId TEXT NOT NULL,
    symbol TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    price REAL NOT NULL,
    type TEXT NOT NULL,
    totalAmount REAL NOT NULL,
    timestamp TEXT NOT NULL
  );
`);

export async function GET(request: NextRequest) {
  try {
    // Get userId from query params
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || '1'; // Default to user 1
    const limit = parseInt(searchParams.get('limit') || '20'); // Default to 20 transactions
    
    // Get transactions for the user, ordered by most recent first
    const transactions = db.prepare(
      'SELECT * FROM transactions WHERE userId = ? ORDER BY timestamp DESC LIMIT ?'
    ).all(userId, limit) as Transaction[];
    
    return NextResponse.json(transactions);
  } catch (error) {
    console.error('Error getting transactions:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve transactions' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const { userId = '1', symbol, quantity, price, type } = await request.json();
    
    if (!symbol || !quantity || !price || !type) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Validate type
    if (type !== 'BUY' && type !== 'SELL') {
      return NextResponse.json(
        { error: 'Type must be either BUY or SELL' },
        { status: 400 }
      );
    }
    
    const totalAmount = quantity * price;
    const timestamp = new Date().toISOString();
    
    // Insert the transaction
    const result = db.prepare(`
      INSERT INTO transactions (userId, symbol, quantity, price, type, totalAmount, timestamp)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(userId, symbol, quantity, price, type, totalAmount, timestamp);
    
    const transaction: Transaction = {
      id: result.lastInsertRowid as number,
      userId,
      symbol,
      quantity,
      price,
      type,
      totalAmount,
      timestamp
    };
    
    return NextResponse.json({
      success: true,
      transaction
    });
  } catch (error) {
    console.error('Error recording transaction:', error);
    return NextResponse.json(
      { error: 'Failed to record transaction' },
      { status: 500 }
    );
  }
} 