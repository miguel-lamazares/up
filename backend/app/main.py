import os
from datetime import datetime, timedelta
from dotenv import load_dotenv
from fastapi import FastAPI, Request, Form, status
from fastapi.responses import HTMLResponse, RedirectResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from jose import JWTError, jwt
from starlette.middleware.base import BaseHTTPMiddleware
from passlib.context import CryptContext
import psycopg2
from psycopg2.extras import RealDictCursor

load_dotenv()

# =============================
# CONFIGURAÇÕES
# =============================

DB_HOST = os.getenv("DB_HOST")
DB_NAME = os.getenv("DB_NAME")
DB_USER = os.getenv("DB_USER")
DB_PASSWORD = os.getenv("DB_PASSWORD")

JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY")
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
JWT_EXPIRATION_MINUTES = int(os.getenv("JWT_EXPIRATION_MINUTES", 60))

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

app = FastAPI()
templates = Jinja2Templates(directory="templates")
app.mount("/static", StaticFiles(directory="static"), name="static")

# =============================
# BANCO
# =============================

def get_db_connection():
    return psycopg2.connect(
        host=DB_HOST,
        database=DB_NAME,
        user=DB_USER,
        password=DB_PASSWORD,
        cursor_factory=RealDictCursor
    )

def buscar_usuario_por_username(username: str):
    conn = get_db_connection()
    try:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT id, username, password FROM usuarios WHERE username = %s",
                (username,)
            )
            return cur.fetchone()
    finally:
        conn.close()

# =============================
# JWT
# =============================

def create_jwt_token(username: str) -> str:
    expire = datetime.utcnow() + timedelta(minutes=JWT_EXPIRATION_MINUTES)
    payload = {"sub": username, "exp": expire}
    return jwt.encode(payload, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)

def decode_jwt_token(token: str):
    try:
        return jwt.decode(token, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])
    except JWTError:
        return None

# =============================
# MIDDLEWARE
# =============================

PUBLIC_PATHS = {"/login", "/", "/logout"}

class AuthMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        path = request.url.path

        if path.startswith("/static") or path in PUBLIC_PATHS:
            return await call_next(request)

        token = request.cookies.get("token")
        if not token:
            return RedirectResponse("/login", status_code=status.HTTP_303_SEE_OTHER)

        payload = decode_jwt_token(token)
        if not payload:
            response = RedirectResponse("/login", status_code=status.HTTP_303_SEE_OTHER)
            response.delete_cookie("token")
            return response

        request.state.user = payload["sub"]
        return await call_next(request)

app.add_middleware(AuthMiddleware)

# =============================
# ROTAS
# =============================

@app.get("/", response_class=HTMLResponse)
@app.get("/login", response_class=HTMLResponse)
async def login_page(request: Request, erro: str = None):
    token = request.cookies.get("token")
    if token and decode_jwt_token(token):
        return RedirectResponse("/dashboard", status_code=303)

    return templates.TemplateResponse(
        "login.html",
        {"request": request, "erro": erro}
    )

@app.post("/login")
async def login(
    request: Request,
    username: str = Form(...),
    password: str = Form(...)
):
    user = buscar_usuario_por_username(username)

    if not user or not pwd_context.verify(password, user["password"]):
        return templates.TemplateResponse(
            "login.html",
            {"request": request, "erro": "Usuário ou senha inválidos"},
            status_code=401
        )

    token = create_jwt_token(user["username"])

    response = RedirectResponse("/dashboard", status_code=303)
    response.set_cookie(
        key="token",
        value=token,
        httponly=True,
        secure=True,  # PRODUÇÃO
        samesite="lax",
        max_age=JWT_EXPIRATION_MINUTES * 60
    )
    return response

@app.get("/logout")
async def logout():
    response = RedirectResponse("/login", status_code=303)
    response.delete_cookie("token")
    return response

@app.get("/dashboard", response_class=HTMLResponse)
async def dashboard(request: Request):
    return templates.TemplateResponse(
        "dashboard.html",
        {
            "request": request,
            "username": request.state.user
        }
    )