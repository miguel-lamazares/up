# app/config.py

from dotenv import load_dotenv
import os

load_dotenv()

def get_env(name: str) -> str:
    value = os.getenv(name)
    if value is None:
        raise RuntimeError(f"{name} não carregado do .env")
    return value

JWT_SECRET_KEY = get_env("JWT_SECRET_KEY")
JWT_ALGORITHM = get_env("JWT_ALGORITHM")
JWT_EXPIRATION_MINUTES = int(get_env("JWT_EXPIRATION_MINUTES"))

PASSWORD_PEPPER = get_env("PASSWORD_PEPPER")