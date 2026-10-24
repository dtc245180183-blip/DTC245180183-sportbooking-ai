"""Script test login."""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
sys.stdout.reconfigure(encoding='utf-8')

from app.core.security import verify_password, hash_password
from app.database import SessionLocal
from app.models.user import User

db = SessionLocal()

print("=== Check hash ===")
h_admin = hash_password("admin123")
print(f"Verify admin123: {verify_password('admin123', h_admin)}")
print(f"Verify wrong   : {verify_password('wrong', h_admin)}")

print("\n=== Check users in DB ===")
users = db.query(User).all()
if not users:
    print("NO USERS IN DB!")
else:
    for u in users:
        pw = "admin123" if u.username == "admin" else "staff123"
        ok = verify_password(pw, u.password_hash)
        print(f"User={u.username}, role={u.role}, pw_hash_len={len(u.password_hash)}, password_ok={ok}")

db.close()
print("\nDone!")
