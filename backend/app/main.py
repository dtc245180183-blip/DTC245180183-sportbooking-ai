import logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import Base, engine, init_db_migrations
import app.models # Register all models
from app.routers import auth, court_types, courts, time_slots, customers, maintenance, payments, bookings, ai, statistics
# Create tables in SQLite
Base.metadata.create_all(bind=engine)
init_db_migrations()

app = FastAPI(title="Sport Court Booking API")

# Configure CORS for Frontend
# NOTE: allow_credentials=True is incompatible with allow_origins=["*"].
# Must specify exact origins when credentials (cookies/auth headers) are used.
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:5175",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174",
        "http://127.0.0.1:5175",
    ],
    allow_origin_regex=r"https://.*\.trycloudflare\.com",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(court_types.router)
app.include_router(courts.router)
app.include_router(time_slots.router)
app.include_router(customers.router)
app.include_router(maintenance.router)
app.include_router(payments.router)
app.include_router(bookings.router)
app.include_router(ai.router)
app.include_router(statistics.router)

@app.get("/")
def root():
    return {"message": "Welcome to Sport Court Booking API"}
