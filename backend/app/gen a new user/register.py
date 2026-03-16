from passlib.context import CryptContext
import os

PEPPER = os.getenv("PASSWORD_PEPPER")
pwd = CryptContext(schemes=["bcrypt"])

print(pwd.hash("password" + f"{PEPPER}"))

# INSERT INTO usuarios (username,password)
# VALUES ('admin','HASH');