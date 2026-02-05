from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from typing import Optional, List
import os

from database import get_db
from auth import verify_token
from models import User
from schemas import User as UserSchema

# Security scheme
security = HTTPBearer()

def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> UserSchema:
    """Get current authenticated user from JWT token."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        token = credentials.credentials
        username = verify_token(token)
        if username is None:
            raise credentials_exception
    except Exception:
        raise credentials_exception
    
    # Get user from database
    user = db.query(User).filter(User.username == username).first()
    if user is None:
        raise credentials_exception
    
    return UserSchema.from_orm(user)

def get_current_active_user(current_user: UserSchema = Depends(get_current_user)) -> UserSchema:
    """Get current active user."""
    if not current_user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    return current_user

def require_admin(current_user: UserSchema = Depends(get_current_user)) -> UserSchema:
    """Require admin role for access."""
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    return current_user

def get_optional_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    db: Session = Depends(get_db)
) -> Optional[UserSchema]:
    """Get current user if authenticated, otherwise return None."""
    if not credentials:
        return None
    
    try:
        token = credentials.credentials
        username = verify_token(token)
        if username is None:
            return None
        
        user = db.query(User).filter(User.username == username).first()
        if user is None or not user.is_active:
            return None
        
        return UserSchema.from_orm(user)
    except Exception:
        return None

# Pagination dependencies
def get_pagination_params(
    page: int = 1,
    size: int = 50,
    search: Optional[str] = None
):
    """Get pagination parameters with validation."""
    if page < 1:
        page = 1
    if size < 1:
        size = 50
    if size > 100:
        size = 100
    
    return {
        "page": page,
        "size": size,
        "search": search,
        "offset": (page - 1) * size
    }
