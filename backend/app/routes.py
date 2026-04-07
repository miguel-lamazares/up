from fastapi import APIRouter, Request, Form, HTTPException, Body
from fastapi.responses import RedirectResponse
from fastapi.templating import Jinja2Templates
from passlib.context import CryptContext
from typing import Optional
from decimal import Decimal
import os

from app.database import (
    buscar_usuario_por_username,
    registrar_login,
    listar_insumos,
    criar_insumo,
    deletar_insumo_db,
    atualizar_quantidade,
    adicionar_lote,
    consumir_lote,
    listar_lotes,
    criar_pedido,
    listar_pedidos,
    obter_pedido

)
from app.auth import create_jwt_token
from app.security import check_rate_limit, brute_force_delay

router = APIRouter()
templates = Jinja2Templates(directory="app/templates")
pwd_context = CryptContext(schemes=["bcrypt"], bcrypt__rounds=12)

PEPPER = os.getenv("PASSWORD_PEPPER")
if not PEPPER:
    raise RuntimeError("PASSWORD_PEPPER não carregado")


# ------------------ LOGIN ------------------

@router.get("/login")
async def login_page(request: Request):
    token = request.cookies.get("token")
    if token:
        return RedirectResponse("/dashboard", status_code=303)
    return templates.TemplateResponse("login.html", {"request": request})


@router.post("/login")
async def login(request: Request, username: str = Form(...), password: str = Form(...)):
    ip = request.client.host
    if not check_rate_limit(ip):
        return templates.TemplateResponse(
            "login.html",
            {"request": request, "erro": "Muitas tentativas. Aguarde um pouco.", "username": username},
            status_code=429
        )

    usuario = buscar_usuario_por_username(username)
    senha_valida = usuario and pwd_context.verify(password + PEPPER, usuario["password"])

    if not usuario or not senha_valida:
        brute_force_delay()
        registrar_login(username, ip, False)
        return templates.TemplateResponse(
            "login.html",
            {"request": request, "erro": "Usuário ou senha inválidos", "username": username},
            status_code=401
        )

    token = create_jwt_token(usuario["username"])
    registrar_login(username, ip, True)
    response = RedirectResponse("/dashboard", status_code=303)
    response.set_cookie(key="token", value=token, httponly=True, secure=False, samesite="lax", max_age=3600)
    return response


# ------------------ DASHBOARD ------------------

@router.get("/dashboard")
async def dashboard(request: Request):
    username = getattr(request.state, "user", None)
    if not username:
        return RedirectResponse("/login", status_code=303)

    insumos = listar_insumos()
    for insumo in insumos:
        insumo["lotes"] = listar_lotes(insumo["id"])

    produtos = insumos
    pedidos = listar_pedidos()

    return templates.TemplateResponse(
        "dashboard.html",
        {
            "request": request,
            "username": username,
            "insumos": insumos,
            "produtos": produtos,
            "pedidos": pedidos
        }
    )


# ------------------ CRUD INSUMOS ------------------

@router.post("/insumos/lote/add")
async def adicionar_lote_route(
    nome: Optional[str] = Form(None),
    insumo_id: Optional[int] = Form(None),
    quantidade: Decimal = Form(...),
    unidade: Optional[str] = Form(None),
    lote: Optional[str] = Form(None),
    validade: Optional[str] = Form(None)
):
    if not insumo_id:
        novo_id = criar_insumo(nome, quantidade, unidade)
        adicionar_lote(novo_id, quantidade, lote, validade)
    else:
        adicionar_lote(insumo_id, quantidade, lote, validade)

    return RedirectResponse("/dashboard#estoque", status_code=303)


@router.post("/insumos/add")
async def adicionar_insumo(nome: str = Form(...), quantidade: float = Form(...), unidade: str = Form(...)):
    criar_insumo(nome, quantidade, unidade)
    return RedirectResponse("/dashboard#estoque", status_code=303)


@router.post("/insumos/delete")
async def deletar_insumo(id: int = Form(...)):
    deletar_insumo_db(id)
    return RedirectResponse("/dashboard#estoque", status_code=303)


@router.post("/insumos/update")
async def atualizar_insumo(id: int = Form(...), quantidade: int = Form(...)):
    atualizar_quantidade(id, quantidade)
    return RedirectResponse("/dashboard#estoque", status_code=303)


@router.post("/insumos/lote/consumir")
async def consumir_lote_route(lote_id: int = Form(...), quantidade: float = Form(...)):
    consumir_lote(lote_id, quantidade)
    return RedirectResponse("/dashboard#estoque", status_code=303)


@router.get("/insumos/{insumo_id}/editar")
async def editar_insumo_page(request: Request, insumo_id: int):
    insumos = listar_insumos()
    insumo = next((i for i in insumos if i["id"] == insumo_id), None)
    return templates.TemplateResponse("editar_insumo.html", {"request": request, "insumo": insumo})


# ------------------ PEDIDOS ------------------

from fastapi import APIRouter, Body, HTTPException

pedido_router = APIRouter(prefix="/pedidos", tags=["Pedidos"])

@pedido_router.post("/add")
def api_criar_pedido(data: dict = Body(...)):
    try:
        pedido_id = criar_pedido(
            cliente=data["cliente"],
            forma_pagamento=data["forma_pagamento"],
            valor_total=data["valor_total"],
            itens=data["itens"]
        )
        return {"status": "success", "pedido_id": pedido_id}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@pedido_router.get("/list")
def api_listar_pedidos():
    return listar_pedidos()


@pedido_router.get("/{pedido_id}")
def api_obter_pedido(pedido_id: int):
    pedido = obter_pedido(pedido_id)
    if not pedido:
        raise HTTPException(status_code=404, detail="Pedido não encontrado")
    return pedido

@router.post("/produtos/add")
async def adicionar_produto_acabado(
    produto_nome: str = Form(...),
    quantidade: Decimal = Form(...),
    lote: str = Form(...),
    validade: str = Form(...)
):
    novo_id = criar_insumo(produto_nome, quantidade, "un")
    adicionar_lote(novo_id, quantidade, lote, validade)
    return RedirectResponse("/dashboard#produtos", status_code=303)