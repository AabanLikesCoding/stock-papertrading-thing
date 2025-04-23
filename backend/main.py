from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List
import yfinance as yf
import models
import schemas
from database import SessionLocal, engine
from datetime import datetime
import os

# Create database tables
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Stock Market Simulator API")

# Get frontend URL from environment variable or use localhost for development
FRONTEND_URL = os.environ.get("FRONTEND_URL", "http://localhost:3000")

# CORS middleware configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=[FRONTEND_URL, "*"],  # Allow requests from the frontend and any origin
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Dependency to get database session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@app.get("/")
def read_root():
    return {"message": "Welcome to Stock Market Simulator API"}

@app.get("/stock/{symbol}")
async def get_stock_price(symbol: str):
    try:
        stock = yf.Ticker(symbol)
        info = stock.info
        return {
            "symbol": symbol.upper(),
            "name": info.get("longName", ""),
            "price": info.get("regularMarketPrice", 0),
            "change": info.get("regularMarketChange", 0),
            "changePercent": info.get("regularMarketChangePercent", 0)
        }
    except Exception as e:
        raise HTTPException(status_code=404, detail=f"Stock {symbol} not found")

@app.get("/my-portfolio/{user_id}")
def get_my_portfolio(user_id: int, db: Session = Depends(get_db)):
    portfolio = db.query(models.Portfolio).filter(models.Portfolio.user_id == user_id).first()
    if not portfolio:
        portfolio = models.Portfolio(user_id=user_id, cash=10000.00)
        db.add(portfolio)
        db.commit()
        db.refresh(portfolio)
    
    positions = []
    for position in portfolio.positions:
        if position.quantity > 0:
            try:
                stock = yf.Ticker(position.symbol)
                current_price = stock.info.get("regularMarketPrice", 0)
                total_value = current_price * position.quantity
                profit_loss = ((current_price - position.average_price) / position.average_price) * 100
                
                positions.append({
                    "symbol": position.symbol,
                    "quantity": position.quantity,
                    "averagePrice": position.average_price,
                    "currentPrice": current_price,
                    "totalValue": total_value,
                    "profitLoss": profit_loss
                })
            except Exception as e:
                print(f"Error fetching data for {position.symbol}: {e}")
    
    return {
        "cash": portfolio.cash,
        "positions": positions
    }

@app.get("/trade-history/{user_id}")
def get_trade_history(user_id: int, db: Session = Depends(get_db)):
    portfolio = db.query(models.Portfolio).filter(models.Portfolio.user_id == user_id).first()
    if not portfolio:
        raise HTTPException(status_code=404, detail="Portfolio not found")
    
    trades = db.query(models.Trade).filter(models.Trade.portfolio_id == portfolio.id).order_by(models.Trade.timestamp.desc()).all()
    
    return [
        {
            "id": trade.id,
            "symbol": trade.symbol,
            "action": trade.trade_type.lower(),
            "quantity": trade.quantity,
            "price": trade.price,
            "total": trade.price * trade.quantity,
            "timestamp": trade.timestamp.isoformat()
        }
        for trade in trades
    ]

@app.post("/trade")
def execute_trade(trade: schemas.TradeRequest, db: Session = Depends(get_db)):
    portfolio = db.query(models.Portfolio).filter(models.Portfolio.user_id == trade.user_id).first()
    if not portfolio:
        raise HTTPException(status_code=404, detail="Portfolio not found")
    
    stock = yf.Ticker(trade.symbol)
    current_price = stock.info.get("regularMarketPrice", 0)
    
    total_cost = current_price * trade.quantity
    
    # Get or create position
    position = db.query(models.Position).filter(
        models.Position.portfolio_id == portfolio.id,
        models.Position.symbol == trade.symbol
    ).first()
    
    if trade.action == "buy":
        if portfolio.cash < total_cost:
            raise HTTPException(status_code=400, detail="Insufficient funds")
        
        portfolio.cash -= total_cost
        
        if position:
            # Update existing position
            new_total = (position.average_price * position.quantity) + (current_price * trade.quantity)
            position.quantity += trade.quantity
            position.average_price = new_total / position.quantity
        else:
            # Create new position
            position = models.Position(
                portfolio_id=portfolio.id,
                symbol=trade.symbol,
                quantity=trade.quantity,
                average_price=current_price
            )
            db.add(position)
            
    else:  # sell
        if not position or position.quantity < trade.quantity:
            raise HTTPException(status_code=400, detail="Insufficient shares")
        
        portfolio.cash += total_cost
        position.quantity -= trade.quantity
        
        if position.quantity == 0:
            db.delete(position)
    
    # Record the trade
    trade_record = models.Trade(
        portfolio_id=portfolio.id,
        symbol=trade.symbol,
        trade_type=trade.action.upper(),
        quantity=trade.quantity,
        price=current_price,
        timestamp=datetime.utcnow()
    )
    db.add(trade_record)
    
    db.commit()
    return {"message": "Trade executed successfully", "new_balance": portfolio.cash} 