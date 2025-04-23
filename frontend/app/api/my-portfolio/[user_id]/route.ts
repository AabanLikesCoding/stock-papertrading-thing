import { NextRequest, NextResponse } from 'next/server';

// Store portfolios in memory - simple demo implementation
const portfolios: Record<string, any> = {};

export async function GET(
  request: NextRequest,
  { params }: { params: { user_id: string } }
) {
  const userId = params.user_id;
  
  // Create portfolio if it doesn't exist
  if (!portfolios[userId]) {
    portfolios[userId] = {
      user_id: parseInt(userId),
      cash: 10000.0,
      positions: []
    };
  }
  
  return NextResponse.json(portfolios[userId]);
} 