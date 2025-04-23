# This is where we set up our database connection! 🔌
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os
from dotenv import load_dotenv

# Load our secret settings
load_dotenv()

# This is where our database lives
# If we don't have a special database URL, we'll use a simple file database
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./my_stock_game.db")

# Create the database engine (like starting up the database)
db_engine = create_engine(DATABASE_URL)

# This helps us talk to the database
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=db_engine)

# This helps us make database tables
Base = declarative_base() 