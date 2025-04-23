import { NextRequest, NextResponse } from 'next/server';

// Import the function from the portfolio API 
// We need to use absolute paths since dynamic imports don't work here
import { getOrCreatePortfolio } from '../../portfolio/route';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId = '1', symbol, quantity, price } = body;
    
    if (!userId || !symbol || !quantity || !price) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Validate inputs
    if (typeof quantity !== 'number' || quantity <= 0) {
      return NextResponse.json(
        { error: 'Quantity must be a positive number' },
        { status: 400 }
      );
    }
    
    if (typeof price !== 'number' || price <= 0) {
      return NextResponse.json(
        { error: 'Price must be a positive number' },
        { status: 400 }
      );
    }
    
    // Call the portfolio endpoint to handle the transaction
    const portfolioUpdateResponse = await fetch(new URL(`/api/portfolio`, request.url).toString(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId,
        symbol,
        shares: quantity,
        price
      }),
    });
    
    if (!portfolioUpdateResponse.ok) {
      const errorData = await portfolioUpdateResponse.json();
      return NextResponse.json(
        { error: errorData.error || 'Failed to process buy request' },
        { status: portfolioUpdateResponse.status }
      );
    }
    
    const portfolioData = await portfolioUpdateResponse.json();
    
    // Record the transaction
    const totalCost = price * quantity;
    const transactionResponse = await fetch(new URL(`/api/transactions`, request.url).toString(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId,
        symbol,
        quantity,
        price,
        type: 'BUY',
        totalAmount: totalCost
      }),
    });
    
    // Get the updated portfolio
    const portfolio = getOrCreatePortfolio(userId);
    
    return NextResponse.json({
      success: true,
      portfolio: portfolio,
      transaction: {
        type: 'BUY',
        symbol,
        quantity,
        price,
        totalCost
      }
    });
  } catch (error) {
    console.error('Error processing buy request:', error);
    return NextResponse.json(
      { error: 'Failed to process buy request' },
      { status: 500 }
    );
  }
} 