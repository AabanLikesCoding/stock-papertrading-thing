from fastapi import FastAPI, HTTPException, Depends, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from typing import List
import yfinance as yf
import models
import schemas
from database import SessionLocal, engine
from datetime import datetime
import os
import logging
import sys

# Configure logging
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger(__name__)

# Create database tables
logger.info("Initializing database...")
models.Base.metadata.create_all(bind=engine)
logger.info("Database initialization complete")

# Create the FastAPI app
app = FastAPI(title="Stock Market Simulator API")

# CORS middleware configuration - allow all origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Add request logging middleware
@app.middleware("http")
async def log_requests(request: Request, call_next):
    logger.info(f"Request: {request.method} {request.url.path}")
    try:
        response = await call_next(request)
        logger.info(f"Response status: {response.status_code}")
        return response
    except Exception as e:
        logger.error(f"Request error: {str(e)}")
        raise

# Dependency to get database session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@app.get("/")
def read_root():
    logger.info("Root endpoint called")
    return {"message": "Welcome to Stock Market Simulator API"}

@app.get("/stock/{symbol}")
async def get_stock_price(symbol: str):
    logger.info(f"Fetching stock data for symbol: {symbol}")
    try:
        stock = yf.Ticker(symbol)
        info = stock.info
        if not info or "regularMarketPrice" not in info:
            logger.error(f"Could not fetch data for {symbol}")
            raise HTTPException(status_code=404, detail=f"Stock {symbol} not found or no data available")
        
        result = {
            "symbol": symbol.upper(),
            "name": info.get("longName", symbol.upper()),
            "price": info.get("regularMarketPrice", 0),
            "change": info.get("regularMarketChange", 0),
            "changePercent": info.get("regularMarketChangePercent", 0)
        }
        logger.info(f"Successfully fetched data for {symbol}: {result}")
        return result
    except Exception as e:
        logger.error(f"Error fetching stock {symbol}: {str(e)}")
        raise HTTPException(status_code=404, detail=f"Stock {symbol} not found: {str(e)}")

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
    logger.info(f"Fetching trade history for user: {user_id}")
    try:
        portfolio = db.query(models.Portfolio).filter(models.Portfolio.user_id == user_id).first()
        if not portfolio:
            logger.warning(f"Portfolio not found for user {user_id}")
            # Create a new portfolio instead of failing
            portfolio = models.Portfolio(user_id=user_id, cash=10000.00)
            db.add(portfolio)
            db.commit()
            db.refresh(portfolio)
            logger.info(f"Created new portfolio for user {user_id}")
            return []
        
        trades = db.query(models.Trade).filter(models.Trade.portfolio_id == portfolio.id).order_by(models.Trade.timestamp.desc()).all()
        
        result = [
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
        logger.info(f"Retrieved {len(result)} trades for user {user_id}")
        return result
    except Exception as e:
        logger.error(f"Error getting trade history: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get trade history: {str(e)}")

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