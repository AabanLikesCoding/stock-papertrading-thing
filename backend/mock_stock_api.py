from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import random
import logging
from typing import Optional

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("mock_stock_api")

# Create FastAPI app
app = FastAPI(title="Super Reliable Stock API")

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Stock data - 100% reliable static data
STOCKS = {
    "AAPL": {"name": "Apple Inc.", "price": 181.75, "change": 1.35},
    "MSFT": {"name": "Microsoft Corporation", "price": 339.48, "change": 0.89},
    "GOOGL": {"name": "Alphabet Inc.", "price": 138.12, "change": -0.45},
    "AMZN": {"name": "Amazon.com Inc.", "price": 128.74, "change": 2.25},
    "TSLA": {"name": "Tesla Inc.", "price": 238.01, "change": -1.20},
    "META": {"name": "Meta Platforms Inc.", "price": 325.95, "change": 3.12},
    "NVDA": {"name": "NVIDIA Corporation", "price": 430.97, "change": 2.37},
    "NFLX": {"name": "Netflix Inc.", "price": 485.13, "change": -1.54},
    "PYPL": {"name": "PayPal Holdings Inc.", "price": 64.42, "change": -0.73},
    "INTC": {"name": "Intel Corporation", "price": 43.32, "change": 0.28},
}

class Portfolio(BaseModel):
    user_id: int
    cash: float = 10000.0
    positions: list = []

class Position(BaseModel):
    symbol: str
    quantity: int
    average_price: float

class TradeRequest(BaseModel):
    user_id: int
    symbol: str
    quantity: int
    trade_type: str  # "BUY" or "SELL"

@app.get("/")
async def root():
    logger.info("Root endpoint called")
    return {"message": "Mock Stock API is running!"}

@app.get("/stock/{symbol}")
async def get_stock_data(symbol: str):
    symbol = symbol.upper()
    logger.info(f"Stock data requested for {symbol}")
    
    # Add a tiny random price variation each time
    if symbol in STOCKS:
        # Copy the data so we don't modify the original
        stock_data = STOCKS[symbol].copy()
        # Add slight variation for realism
        variation = random.uniform(-2.0, 2.0)
        stock_data["price"] = round(stock_data["price"] + variation, 2)
        stock_data["change"] = round(stock_data["change"] + (variation / 10), 2)
        stock_data["symbol"] = symbol
        
        logger.info(f"Returning stock data for {symbol}")
        return stock_data
    else:
        # For unknown symbols, generate random but realistic data
        price = round(random.uniform(50, 500), 2)
        change = round(random.uniform(-3, 3), 2)
        
        logger.info(f"Returning random data for unknown symbol {symbol}")
        return {
            "symbol": symbol,
            "name": f"{symbol} Inc.",
            "price": price,
            "change": change
        }

# Store user portfolios in memory (would use a database in real app)
portfolios = {}

@app.get("/my-portfolio/{user_id}")
async def get_portfolio(user_id: int):
    user_id_str = str(user_id)
    
    if user_id_str not in portfolios:
        # Create new portfolio
        portfolios[user_id_str] = {
            "cash": 10000.0,
            "positions": []
        }
    
    return portfolios[user_id_str]

@app.post("/make-trade")
async def execute_trade(trade: TradeRequest):
    user_id = str(trade.user_id)
    symbol = trade.symbol.upper()
    
    # Ensure user has a portfolio
    if user_id not in portfolios:
        portfolios[user_id] = {
            "cash": 10000.0,
            "positions": []
        }
    
    portfolio = portfolios[user_id]
    
    # Get current stock price
    stock_data = await get_stock_data(symbol)
    price = stock_data["price"]
    total_cost = price * trade.quantity
    
    # Process trade
    if trade.trade_type == "BUY":
        # Check if user has enough cash
        if portfolio["cash"] < total_cost:
            raise HTTPException(status_code=400, detail="Not enough cash for this trade")
        
        # Update cash
        portfolio["cash"] -= total_cost
        
        # Update positions
        position_exists = False
        for position in portfolio["positions"]:
            if position["symbol"] == symbol:
                # Update existing position
                total_value = (position["quantity"] * position["average_price"]) + total_cost
                position["quantity"] += trade.quantity
                position["average_price"] = total_value / position["quantity"]
                position_exists = True
                break
        
        if not position_exists:
            # Add new position
            portfolio["positions"].append({
                "symbol": symbol,
                "quantity": trade.quantity,
                "average_price": price
            })
    
    elif trade.trade_type == "SELL":
        # Find position
        position = None
        for p in portfolio["positions"]:
            if p["symbol"] == symbol:
                position = p
                break
        
        if not position or position["quantity"] < trade.quantity:
            raise HTTPException(status_code=400, detail="Not enough shares to sell")
        
        # Update cash
        portfolio["cash"] += total_cost
        
        # Update position
        position["quantity"] -= trade.quantity
        
        # Remove position if quantity is 0
        if position["quantity"] == 0:
            portfolio["positions"] = [p for p in portfolio["positions"] if p["symbol"] != symbol]
    
    return {
        "message": "Trade executed successfully",
        "new_balance": portfolio["cash"],
        "trade_info": {
            "symbol": symbol,
            "quantity": trade.quantity,
            "price": price,
            "total": total_cost,
            "type": trade.trade_type
        }
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000) 