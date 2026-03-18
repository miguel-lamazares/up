from datetime import datetime, timedelta
from jose import jwt, JWTError

from app.config import (
    JWT_SECRET_KEY,
    JWT_ALGORITHM,
    JWT_EXPIRATION_MINUTES
)


TOKEN_BLACKLIST = set()

def create_jwt_token(username: str):
    expire = datetime.utcnow() + timedelta(minutes=JWT_EXPIRATION_MINUTES)

    payload = {
        "sub": username,
        "iat": datetime.utcnow(),
        "exp": expire
    }

    return jwt.encode(payload, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)

def decode_jwt_token(token: str):
    if token in TOKEN_BLACKLIST:
        return None

    try:
        payload = jwt.decode(
            token,
            JWT_SECRET_KEY,
            algorithms=[JWT_ALGORITHM]
        )
        return payload
    except JWTError:
        return None

def blacklist_token(token: str):
    TOKEN_BLACKLIST.add(token)