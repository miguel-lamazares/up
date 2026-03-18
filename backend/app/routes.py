from fastapi import Request, Form, APIRouter
from fastapi.responses import RedirectResponse
from fastapi.templating import Jinja2Templates
from passlib.context import CryptContext
import os

from app.database import (
    buscar_usuario_por_username,
    registrar_login,
    listar_insumos,
    criar_insumo,
    deletar_insumo_db,
    atualizar_quantidade
)

from app.auth import create_jwt_token, blacklist_token
from app.security import check_rate_limit, brute_force_delay

router = APIRouter()

templates = Jinja2Templates(directory="app/templates")

pwd_context = CryptContext(
    schemes=["bcrypt"],
    bcrypt__rounds=12
)

PEPPER = os.getenv("PASSWORD_PEPPER")
if not PEPPER:
    raise RuntimeError("PASSWORD_PEPPER não carregado")

# ------------------ LOGIN PAGE ------------------

@router.get("/login")
async def login_page(request: Request):
    token = request.cookies.get("token")

    if token:
        return RedirectResponse("/dashboard", status_code=303)

    return templates.TemplateResponse(
        "login.html",
        {"request": request}
    )

# ------------------ LOGIN ------------------

@router.post("/login")
async def login(request: Request, username: str = Form(...), password: str = Form(...)):
    ip = request.client.host

    if not check_rate_limit(ip):
        return templates.TemplateResponse(
            "login.html",
            {
                "request": request,
                "erro": "Muitas tentativas. Aguarde um pouco.",
                "username": username
            },
            status_code=429
        )

    usuario = buscar_usuario_por_username(username)

    senha_valida = False

    if usuario:
        senha_valida = pwd_context.verify(
            password + PEPPER,
            usuario["password"]
        )

    if not usuario or not senha_valida:
        brute_force_delay()
        registrar_login(username, ip, False)

        return templates.TemplateResponse(
            "login.html",
            {
                "request": request,
                "erro": "Usuário ou senha inválidos",
                "username": username
            },
            status_code=401
        )

    token = create_jwt_token(usuario["username"])
    registrar_login(username, ip, True)

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

# ------------------ DASHBOARD (agora com insumos) ------------------

@router.get("/dashboard")
async def dashboard(request: Request):
    username = getattr(request.state, "user", None)
    if not username:
        return RedirectResponse("/login", status_code=303)

    insumos = listar_insumos()  # busca todos os insumos

    return templates.TemplateResponse(
        "dashboard.html",
        {
            "request": request,
            "username": username,
            "insumos": insumos
        }
    )

# Rotas de CRUD de insumos com redirecionamento para /dashboard#estoque
@router.post("/insumos/add")
async def adicionar_insumo(
    nome: str = Form(...),
    quantidade: int = Form(...),
    unidade: str = Form(...)
):
    criar_insumo(nome, quantidade, unidade)
    return RedirectResponse("/dashboard#estoque", status_code=303)

@router.post("/insumos/delete")
async def deletar_insumo(id: int = Form(...)):
    deletar_insumo_db(id)
    return RedirectResponse("/dashboard#estoque", status_code=303)

@router.post("/insumos/update")
async def atualizar_insumo(
    id: int = Form(...),
    quantidade: int = Form(...)
):
    atualizar_quantidade(id, quantidade)
    return RedirectResponse("/dashboard#estoque", status_code=303)
    response.delete_cookie("token")

    return response

# ------------------ CRUD INSUMOS (agora redirecionam para /dashboard#estoque) ------------------

@router.post("/insumos/add")
async def adicionar_insumo(
    nome: str = Form(...),
    quantidade: int = Form(...),
    unidade: str = Form(...)
):
    criar_insumo(nome, quantidade, unidade)
    return RedirectResponse("/dashboard#estoque", status_code=303)

@router.post("/insumos/delete")
async def deletar_insumo(id: int = Form(...)):
    deletar_insumo_db(id)
    return RedirectResponse("/dashboard#estoque", status_code=303)

@router.post("/insumos/update")
async def atualizar_insumo(
    id: int = Form(...),
    quantidade: int = Form(...)
):
    atualizar_quantidade(id, quantidade)
    return RedirectResponse("/dashboard#estoque", status_code=303)