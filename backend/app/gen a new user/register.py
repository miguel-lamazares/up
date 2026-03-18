from passlib.context import CryptContext
import os

pwd_context = CryptContext(schemes=["bcrypt"], bcrypt__rounds=12)

PEPPER = "crenilda"

def gerar_hash(password: str):
    return pwd_context.hash(password + PEPPER)


# exemplo
senha = "Admin@123"
hash_final = gerar_hash(senha)

print(hash_final)