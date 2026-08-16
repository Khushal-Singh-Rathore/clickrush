import json
import urllib.parse
import urllib.request
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from app.config import settings
from app.database import get_db
from app.dependencies import get_current_user
from app.limiter import limiter
from app.models.users import User
from app.schemas.auth import Token, UserLogin, UserRegister, UserResponse
from app.utils.security import create_access_token, hash_password, verify_password

router = APIRouter(prefix="/auth", tags=["Authentication"])


def verify_turnstile_captcha(token: str | None, client_ip: str | None = None) -> bool:
    """Verify Cloudflare Turnstile CAPTCHA token against Cloudflare's verification API."""
    if not settings.TURNSTILE_SECRET_KEY:
        # If Turnstile is not enabled via environment variable, bypass verification
        return True

    if not token:
        return False

    try:
        url = "https://challenges.cloudflare.com/turnstile/v0/siteverify"
        payload = urllib.parse.urlencode({
            "secret": settings.TURNSTILE_SECRET_KEY,
            "response": token,
            "remoteip": client_ip or "",
        }).encode("utf-8")

        req = urllib.request.Request(url, data=payload, method="POST")
        with urllib.request.urlopen(req, timeout=5) as response:
            res_data = json.loads(response.read().decode("utf-8"))
            return bool(res_data.get("success", False))
    except Exception as e:
        print("Turnstile verification error:", e)
        return False


@router.post(
    "/register",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new user",
)
@limiter.limit("10/minute")
def register(
    request: Request,
    user_in: UserRegister,
    db: Annotated[Session, Depends(get_db)],
) -> User:
    """Register a new user with name, email, password, and optional Turnstile CAPTCHA."""
    # Verify Turnstile CAPTCHA if configured
    client_ip = request.client.host if request.client else None
    if not verify_turnstile_captcha(user_in.turnstile_token, client_ip):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="CAPTCHA verification failed. Please complete the security challenge.",
        )

    existing_user = db.query(User).filter(User.email == user_in.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )

    user = User(
        name=user_in.name,
        email=user_in.email,
        password_hash=hash_password(user_in.password),
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.post(
    "/login",
    response_model=Token,
    status_code=status.HTTP_200_OK,
    summary="Authenticate user and return JWT access token",
)
@limiter.limit("15/minute")
def login(
    request: Request,
    credentials: UserLogin,
    db: Annotated[Session, Depends(get_db)],
) -> Token:
    """Authenticate user with email and password, returning a JWT token."""
    # Verify Turnstile CAPTCHA if configured
    client_ip = request.client.host if request.client else None
    if not verify_turnstile_captcha(credentials.turnstile_token, client_ip):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="CAPTCHA verification failed. Please complete the security challenge.",
        )

    invalid_credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    user = db.query(User).filter(User.email == credentials.email).first()
    if not user or not user.is_active:
        raise invalid_credentials_exception

    if not verify_password(credentials.password, user.password_hash):
        raise invalid_credentials_exception

    access_token = create_access_token(user_id=user.id)
    return Token(access_token=access_token, token_type="bearer")


@router.get(
    "/me",
    response_model=UserResponse,
    status_code=status.HTTP_200_OK,
    summary="Get current authenticated user profile",
)
def get_me(
    current_user: Annotated[User, Depends(get_current_user)],
) -> User:
    """Return profile information for the currently authenticated user."""
    return current_user
