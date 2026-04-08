from fastapi import APIRouter, Request, Form, HTTPException, Body
from fastapi.responses import RedirectResponse, JSONResponse
from fastapi.templating import Jinja2Templates
from passlib.context import CryptContext
from typing import Optional
from decimal import Decimal
from pydantic import BaseModel
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
    obter_pedido,
    cancelar_pedido_e_devolver_estoque,
    listar_clientes,
    criar_cliente,
    deletar_cliente,
    consumir_estoque_fefo,
)
from app.auth import create_jwt_token
from app.security import check_rate_limit, brute_force_delay

router = APIRouter()
pedido_router = APIRouter(prefix="/api/pedidos", tags=["Pedidos"])
auth_router = APIRouter(prefix="/api/auth", tags=["Auth API"])
cliente_router = APIRouter(prefix="/api/clientes", tags=["Clientes"])

templates = Jinja2Templates(directory="app/templates")
pwd_context = CryptContext(schemes=["bcrypt"], bcrypt__rounds=12)

PEPPER = os.getenv("PASSWORD_PEPPER")
if not PEPPER:
    raise RuntimeError("PASSWORD_PEPPER não carregado")


class LoginRequest(BaseModel):
    username: str
    password: str


# ------------------ LOGIN LEGADO ------------------

@router.get("/login")
async def login_page(request: Request):
    token = request.cookies.get("token")
    if token:
        return JSONResponse({
            "success": True,
            "redirect": "/dashboard"
        })
    return templates.TemplateResponse("login.html", {"request": request})


@router.post("/login")
async def login(request: Request, username: str = Form(...), password: str = Form(...)):
    ip = request.client.host

    if not check_rate_limit(ip):
        return templates.TemplateResponse(
            "login.html",
            {
                "request": request,
                "erro": "Muitas tentativas. Aguarde um pouco.",
                "username": username,
            },
            status_code=429,
        )

    usuario = buscar_usuario_por_username(username)
    senha_valida = usuario and pwd_context.verify(password + PEPPER, usuario["password"])

    if not usuario or not senha_valida:
        brute_force_delay()
        registrar_login(username, ip, False)
        return templates.TemplateResponse(
            "login.html",
            {
                "request": request,
                "erro": "Usuário ou senha inválidos",
                "username": username,
            },
            status_code=401,
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
        max_age=3600,
    )
    return response


# ------------------ AUTH API REACT ------------------

@auth_router.post("/login")
async def api_login(data: LoginRequest, request: Request):
    ip = request.client.host

    if not check_rate_limit(ip):
        raise HTTPException(status_code=429, detail="Muitas tentativas. Aguarde um pouco.")

    usuario = buscar_usuario_por_username(data.username)
    senha_valida = usuario and pwd_context.verify(
        data.password + PEPPER,
        usuario["password"],
    )

    if not usuario or not senha_valida:
        brute_force_delay()
        registrar_login(data.username, ip, False)
        raise HTTPException(status_code=401, detail="Usuário ou senha inválidos")

    token = create_jwt_token(usuario["username"])
    registrar_login(data.username, ip, True)

    return {
        "token": token,
        "username": usuario["username"],
    }


@auth_router.get("/me")
async def api_me(request: Request):
    username = getattr(request.state, "user", None)

    if not username:
        raise HTTPException(status_code=401, detail="Não autenticado")

    return {"username": username}


# ------------------ DASHBOARD ------------------

@router.get("/dashboard")
async def dashboard(request: Request):
    username = getattr(request.state, "user", None)
    if not username:
        return RedirectResponse("/login", status_code=303)

    insumos = listar_insumos()
    for insumo in insumos:
        insumo["lotes"] = listar_lotes(insumo["id"])

    pedidos = listar_pedidos()

    return templates.TemplateResponse(
        "dashboard.html",
        {
            "request": request,
            "username": username,
            "insumos": insumos,
            "produtos": insumos,
            "pedidos": pedidos,
        },
    )


# ------------------ INSUMOS TEMPLATE ------------------

@router.post("/insumos/lote/add")
async def adicionar_lote_route(
    nome: Optional[str] = Form(None),
    insumo_id: Optional[int] = Form(None),
    quantidade: Decimal = Form(...),
    unidade: Optional[str] = Form(None),
    lote: Optional[str] = Form(None),
    validade: Optional[str] = Form(None),
):
    if not insumo_id:
        novo_id = criar_insumo(nome, quantidade, unidade)
        adicionar_lote(novo_id, quantidade, lote, validade)
    else:
        adicionar_lote(insumo_id, quantidade, lote, validade)

    return RedirectResponse("/dashboard#estoque", status_code=303)


@router.post("/insumos/add")
async def adicionar_insumo(
    nome: str = Form(...),
    quantidade: float = Form(...),
    unidade: str = Form(...),
):
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


# ------------------ INSUMOS API ------------------

@router.get("/api/insumos/list")
def api_listar_insumos_com_lotes():
    insumos = listar_insumos()
    for insumo in insumos:
        insumo["lotes"] = listar_lotes(insumo["id"])
    return insumos


# ------------------ PEDIDOS API ------------------

@pedido_router.post("/add")
def api_criar_pedido(data: dict = Body(...)):
    try:
        pedido_id = criar_pedido(
            cliente=data["cliente"],
            forma_pagamento=data["forma_pagamento"],
            valor_total=data["valor_total"],
            itens=data["itens"],
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


@pedido_router.post("/{pedido_id}/cancelar")
def api_cancelar_pedido(pedido_id: int):
    try:
        cancelar_pedido_e_devolver_estoque(pedido_id)
        return {"status": "success"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


# ------------------ CLIENTES API ------------------

@cliente_router.get("/list")
def api_listar_clientes():
    return listar_clientes()


@cliente_router.post("/add")
def api_adicionar_cliente(data: dict = Body(...)):
    cliente_id = criar_cliente(
        nome=data["nome"],
        telefone=data.get("telefone"),
        endereco=data.get("endereco"),
    )
    return {"status": "success", "cliente_id": cliente_id}


@cliente_router.post("/delete")
def api_deletar_cliente(data: dict = Body(...)):
    deletar_cliente(data["id"])
    return {"status": "success"}


# ------------------ PRODUÇÃO / PRODUTOS ------------------

@router.post("/api/produtos/add")
async def adicionar_produto_acabado(data: dict = Body(...)):
    produto_nome = data["produto_nome"]
    quantidade = Decimal(str(data["quantidade"]))
    lote = data["lote"]
    validade = data["validade"]
    insumos_consumidos = data.get("insumos_consumidos", [])

    novo_id = criar_insumo(produto_nome, quantidade, "un")
    adicionar_lote(novo_id, quantidade, lote, validade)

    for item in insumos_consumidos:
        consumir_estoque_fefo(
            insumo_id=item["insumo_id"],
            quantidade=item["quantidade"],
        )

    return {"status": "success", "produto_id": novo_id}



@auth_router.post("/logout")
def logout():
    response = JSONResponse({"status": "success"})
    response.delete_cookie("token")
    return response