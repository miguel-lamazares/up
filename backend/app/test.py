from passlib.context import CryptContext
import hashlib
import os

pwd_context = CryptContext(schemes=["bcrypt"], bcrypt__rounds=12)

PEPPER = "crenilda"

def normalize_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()

senha = "Admin@123"

print("Teste 1:", normalize_password(senha))
print("Teste 2:", senha + PEPPER)
print("Teste 3:", normalize_password(senha + PEPPER))