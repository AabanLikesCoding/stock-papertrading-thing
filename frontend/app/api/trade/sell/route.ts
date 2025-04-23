import { NextRequest, NextResponse } from 'next/server';

// Import the function from the portfolio API
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
    
    // Get the portfolio to check for shares
    const portfolio = getOrCreatePortfolio(userId);
    
    // Check if user has the shares to sell
    if (!portfolio.holdings[symbol] || portfolio.holdings[symbol].shares < quantity) {
      return NextResponse.json(
        { error: 'Insufficient shares to sell' },
        { status: 400 }
      );
    }

    // Calculate profit/loss from this sale
    const avgPurchasePrice = portfolio.holdings[symbol].avgPrice;
    const profitLoss = (price - avgPurchasePrice) * quantity;
    
    // Call the portfolio endpoint to handle the transaction (negative shares for selling)
    const portfolioUpdateResponse = await fetch(new URL(`/api/portfolio`, request.url).toString(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId,
        symbol,
        shares: -quantity, // Negative for selling
        price
      }),
    });
    
    if (!portfolioUpdateResponse.ok) {
      const errorData = await portfolioUpdateResponse.json();
      return NextResponse.json(
        { error: errorData.error || 'Failed to process sell request' },
        { status: portfolioUpdateResponse.status }
      );
    }
    
    const portfolioData = await portfolioUpdateResponse.json();
    
    // Record the transaction
    const totalProceeds = price * quantity;
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
        type: 'SELL',
        totalAmount: totalProceeds
      }),
    });
    
    // Get updated portfolio
    const updatedPortfolio = getOrCreatePortfolio(userId);
    
    return NextResponse.json({
      success: true,
      portfolio: updatedPortfolio,
      transaction: {
        type: 'SELL',
        symbol,
        quantity,
        price,
        totalProceeds,
        profitLoss
      }
    });
  } catch (error) {
    console.error('Error processing sell request:', error);
    return NextResponse.json(
      { error: 'Failed to process sell request' },
      { status: 500 }
    );
  }
} 