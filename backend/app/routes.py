import os
from fastapi import Request, Form
from fastapi.responses import HTMLResponse, RedirectResponse
from passlib.context import CryptContext
from fastapi.templating import Jinja2Templates
from database import buscar_usuario_por_username
from auth import create_jwt_token

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
        secure=False if ENV == "dev" else True,
        samesite="lax",
        max_age=3600
    )

    return response


async def dashboard(request: Request):

    return templates.TemplateResponse(
        "dashboard.html",
        {
            "request": request,
            "username": request.state.user
        }
    )


async def logout():

    response = RedirectResponse("/login", status_code=303)
    response.delete_cookie("token")

    return response