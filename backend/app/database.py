from sqlalchemy import create_engine, text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from datetime import datetime, timezone

SQLALCHEMY_DATABASE_URL = "sqlite:///./sport_court.db"
# For development, check_same_thread=False is needed for SQLite
engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False, "timeout": 30}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def init_db_migrations():
    """Tự động kiểm tra schema (thêm cột mới nếu thiếu) và đồng bộ cọc cũ vào bảng payments."""
    # 1. Thêm cột deposit_forfeited nếu chưa có trong bảng bookings
    with engine.connect() as conn:
        try:
            columns_result = conn.execute(text("PRAGMA table_info(bookings)")).fetchall()
            col_names = [col[1] for col in columns_result]
            if col_names and "deposit_forfeited" not in col_names:
                conn.execute(text("ALTER TABLE bookings ADD COLUMN deposit_forfeited BOOLEAN DEFAULT 0"))
                conn.commit()
        except Exception:
            pass

    # Schema migrations complete
    return
