# My database tables for the stock market game! 📊
from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from my_database_stuff import Base
from datetime import datetime

class User(Base):
    __tablename__ = "users"  # This is like a spreadsheet for users

    # Each user has these things:
    id = Column(Integer, primary_key=True, index=True)  # A unique number for each user
    username = Column(String, unique=True, index=True)  # Their cool username
    email = Column(String, unique=True, index=True)     # Their email
    password = Column(String)                           # Their secret password
    portfolio = relationship("Portfolio", back_populates="user", uselist=False)  # Their money and stocks!

class Portfolio(Base):
    __tablename__ = "portfolios"  # This is where we track everyone's money and stocks

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))  # Which user owns this portfolio
    cash = Column(Float, default=10000.00)            # How much money they have (start with $10k!)
    user = relationship("User", back_populates="portfolio")
    stocks = relationship("Position", back_populates="portfolio")  # What stocks they own
    trades = relationship("Trade", back_populates="portfolio")    # Their trading history

class Position(Base):
    __tablename__ = "stocks_owned"  # The stocks people own

    id = Column(Integer, primary_key=True, index=True)
    portfolio_id = Column(Integer, ForeignKey("portfolios.id"))  # Whose portfolio this belongs to
    symbol = Column(String, index=True)      # Stock symbol (like AAPL for Apple)
    quantity = Column(Float)                 # How many shares they own
    average_price = Column(Float)            # Average price they paid per share
    portfolio = relationship("Portfolio", back_populates="stocks")

class Trade(Base):
    __tablename__ = "trading_history"  # Keep track of all trades

    id = Column(Integer, primary_key=True, index=True)
    portfolio_id = Column(Integer, ForeignKey("portfolios.id"))
    symbol = Column(String, index=True)      # What stock was traded
    quantity = Column(Float)                 # How many shares
    price = Column(Float)                    # What was the price
    trade_type = Column(String)             # BUY or SELL
    when = Column(DateTime, default=datetime.utcnow)  # When did they make the trade
    portfolio = relationship("Portfolio", back_populates="trades") 