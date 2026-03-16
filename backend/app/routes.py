from fastapi import Request, Form
from fastapi.responses import HTMLResponse, RedirectResponse
from fastapi.templating import Jinja2Templates
from passlib.context import CryptContext
import os

from app.database import buscar_usuario_por_username, registrar_login
from app.auth import create_jwt_token, blacklist_token
from app.security import check_rate_limit, brute_force_delay

PEPPER = os.getenv("PASSWORD_PEPPER")

templates = Jinja2Templates(directory="app/templates")

pwd_context = CryptContext(
    schemes=["bcrypt"],
    bcrypt__rounds=12
)


async def login_page(request: Request):

    token = request.cookies.get("token")

    if token:
        return RedirectResponse("/dashboard", status_code=303)

    return templates.TemplateResponse(
        "login.html",
        {"request": request}
    )


async def login(request: Request, username: str = Form(...), password: str = Form(...)):

    ip = request.client.host

    if not check_rate_limit(ip):
        return HTMLResponse("Too many attempts", status_code=429)

    usuario = buscar_usuario_por_username(username)

    if not usuario:

        brute_force_delay()

        registrar_login(username, ip, False)

        return templates.TemplateResponse(
            "login.html",
            {"request": request, "erro": "Usuário ou senha inválidos"},
            status_code=401
        )

    if not pwd_context.verify(password + PEPPER, usuario["password"]):

        brute_force_delay()

        registrar_login(username, ip, False)

        return templates.TemplateResponse(
            "login.html",
            {"request": request, "erro": "Usuário ou senha inválidos"},
            status_code=401
        )

    token = create_jwt_token(usuario["username"])

    registrar_login(username, ip, True)

    response = RedirectResponse("/dashboard", status_code=303)

    response.set_cookie(
        key="token",
        value=token,
        httponly=True,
        secure=True,
        samesite="lax",
        max_age=3600
    )

    return response


async def dashboard(request: Request):

    username = request.state.user

    return templates.TemplateResponse(
        "dashboard.html",
        {
            "request": request,
            "username": username
        }
    )


async def logout(request: Request):

    token = request.cookies.get("token")

    if token:
        blacklist_token(token)

    response = RedirectResponse("/login", status_code=303)

    response.delete_cookie("token")

    return response