import os
from fastapi import Request, Form
from fastapi.responses import HTMLResponse, RedirectResponse
from passlib.context import CryptContext
from fastapi.templating import Jinja2Templates
from app.database import buscar_usuario_por_username
from app.auth import create_jwt_token

templates = Jinja2Templates(directory="app/templates")

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

ENV = os.getenv("ENV")

async def login_page(request: Request, erro: str = None):

    token = request.cookies.get("token")

    if token:
        return RedirectResponse("/dashboard", status_code=303)

    return templates.TemplateResponse(
        "login.html",
        {"request": request, "erro": erro}
    )


async def login(request: Request, username: str = Form(...), password: str = Form(...)):

    ADMIN_USER = "admin"
    ADMIN_PASS = "Admin@123"

    if username != ADMIN_USER or password != ADMIN_PASS:
        return templates.TemplateResponse(
            "login.html",
            {"request": request, "erro": "Usuário ou senha inválidos"},
            status_code=401
        )

    token = create_jwt_token(username)

    response = RedirectResponse("/dashboard", status_code=303)

    response.set_cookie(
        key="token",
        value=token,
        httponly=True,
        secure=False,
        samesite="lax",
        max_age=3600
    )

    return response


async def dashboard(request: Request):
    username = getattr(request.state, "user", None)
    return templates.TemplateResponse(
        "dashboard.html",
        {
            "request": request,
            "username": username
        }
    )


async def logout():

    response = RedirectResponse("/login", status_code=303)
    response.delete_cookie("token")

    return response