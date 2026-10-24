from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.schemas.user import UserCreate, UserResponse, UserUpdate
from app.core.security import hash_password, verify_password, create_access_token
from app.dependencies import get_current_user, require_admin
from jose import JWTError, ExpiredSignatureError
from typing import List

router = APIRouter(prefix="/auth", tags=["auth"])

@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register(user_in: UserCreate, request: Request, db: Session = Depends(get_db)):
    user_count = db.query(User).count()
    if user_count > 0:
        auth_header = request.headers.get("Authorization")
        if not auth_header or not auth_header.startswith("Bearer "):
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")
        
        token = auth_header.split(" ")[1]
        from app.core.security import decode_access_token
        try:
            payload = decode_access_token(token)
        except ExpiredSignatureError:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token đã hết hạn")
        except JWTError:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token không hợp lệ")
            
        current_username = payload.get("username")
        current_user = db.query(User).filter(User.username == current_username).first()
        
        if not current_user or current_user.role != "admin":
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Chỉ Quản lý (Admin) mới có quyền thực hiện thao tác này")
    else:
        # Nếu DB trống, force role thành admin
        user_in.role = "admin"

    if db.query(User).filter(User.username == user_in.username).first():
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Tên đăng nhập đã tồn tại")
        
    new_user = User(
        username=user_in.username,
        full_name=user_in.full_name,
        role=user_in.role,
        password_hash=hash_password(user_in.password)
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@router.post("/login")
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == form_data.username).first()
    if not user or not verify_password(form_data.password, str(user.password_hash)):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Sai tên đăng nhập hoặc mật khẩu",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token = create_access_token(
        data={"sub": str(user.id), "username": user.username, "role": user.role}
    )
    return {"access_token": access_token, "token_type": "bearer", "role": user.role, "full_name": user.full_name}

@router.get("/me", response_model=UserResponse)
def read_users_me(current_user: User = Depends(get_current_user)):
    return current_user

@router.get("/users", response_model=List[UserResponse])
def get_users(db: Session = Depends(get_db), current_user: User = Depends(require_admin)):
    return db.query(User).all()

@router.put("/users/{user_id}", response_model=UserResponse)
def update_user(user_id: int, user_update: UserUpdate, db: Session = Depends(get_db), current_user: User = Depends(require_admin)):
    db_user = db.query(User).filter(User.id == user_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="Không tìm thấy người dùng")
        
    update_data = user_update.model_dump(exclude_unset=True)
    
    if user_id == current_user.id and "role" in update_data and update_data["role"] != current_user.role:
        raise HTTPException(status_code=400, detail="Bạn không thể tự thay đổi quyền của chính mình")
        
    if "password" in update_data and update_data["password"]:
        setattr(db_user, "password_hash", hash_password(update_data["password"]))
        del update_data["password"]
        
    for key, value in update_data.items():
        setattr(db_user, key, value)
        
    db.commit()
    db.refresh(db_user)
    return db_user

@router.delete("/users/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user(user_id: int, db: Session = Depends(get_db), current_user: User = Depends(require_admin)):
    if user_id == current_user.id:
        raise HTTPException(status_code=400, detail="Bạn không thể tự xóa tài khoản của chính mình")
        
    db_user = db.query(User).filter(User.id == user_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="Không tìm thấy người dùng")
        
    db.delete(db_user)
    db.commit()
