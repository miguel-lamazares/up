from fastapi import APIRouter, Request, Form, HTTPException, Body
from fastapi.responses import RedirectResponse, JSONResponse
from fastapi.templating import Jinja2Templates
from passlib.context import CryptContext
from typing import Optional, List
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
    obter_pedido,
    # Novos imports
    cancelar_pedido_db,
    listar_clientes,
    criar_cliente,
    deletar_cliente_db,
    adicionar_produto_com_insumos,
)
from app.auth import create_jwt_token
from app.security import check_rate_limit, brute_force_delay

router = APIRouter()
templates = Jinja2Templates(directory="app/templates")
pwd_context = CryptContext(schemes=["bcrypt"], bcrypt__rounds=12)

PEPPER = os.getenv("PASSWORD_PEPPER")
if not PEPPER:
    raise RuntimeError("PASSWORD_PEPPER não carregado")

# ==========================================
# ================ AUTH (JSON) =============
# ==========================================

@router.post("/auth/login")
async def api_login(request: Request, data: dict = Body(...)):
    """Login via JSON (usado pelo frontend React)"""
    username = data.get("username", "")
    password = data.get("password", "")
    ip = request.client.host

    if not check_rate_limit(ip):
        raise HTTPException(status_code=429, detail="Muitas tentativas. Aguarde um pouco.")

    usuario = buscar_usuario_por_username(username)
    senha_valida = usuario and pwd_context.verify(password + PEPPER, usuario["password"])

    if not usuario or not senha_valida:
        brute_force_delay()
        registrar_login(username, ip, False)
        raise HTTPException(status_code=401, detail="Usuário ou senha inválidos")

    token = create_jwt_token(usuario["username"])
    registrar_login(username, ip, True)

    response = JSONResponse(content={"token": token})
    response.set_cookie(
        key="token", value=token,
        httponly=True, secure=False, samesite="lax", max_age=3600
    )
    return response

@router.post("/auth/logout")
async def api_logout():
    """Logout: limpa o cookie de autenticação"""
    response = JSONResponse(content={"status": "ok"})
    response.delete_cookie("token")
    return response

# ==========================================
# ========= LOGIN ORIGINAL (Form) =========
# ==========================================

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

# ==========================================
# ============== DASHBOARD =================
# ==========================================

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

# ==========================================
# =========== CRUD INSUMOS =================
# ==========================================

# --- JSON endpoints (React frontend) ---

@router.get("/insumos/list")
async def api_listar_insumos():
    """Lista todos os insumos com seus lotes (JSON)"""
    insumos = listar_insumos()
    for insumo in insumos:
        insumo["lotes"] = listar_lotes(insumo["id"])
    return insumos

@router.post("/insumos/add")
async def api_adicionar_insumo(data: dict = Body(None), nome: str = Form(None), quantidade: float = Form(None), unidade: str = Form(None)):
    """Adiciona insumo - aceita JSON ou Form"""
    if data:
        # JSON request (React)
        criar_insumo(data["nome"], data["quantidade"], data["unidade"])
        return {"status": "ok"}
    else:
        # Form request (templates)
        criar_insumo(nome, quantidade, unidade)
        return RedirectResponse("/dashboard#estoque", status_code=303)

@router.post("/insumos/delete")
async def api_deletar_insumo(data: dict = Body(None), id: int = Form(None)):
    if data:
        deletar_insumo_db(data["id"])
        return {"status": "ok"}
    else:
        deletar_insumo_db(id)
        return RedirectResponse("/dashboard#estoque", status_code=303)

@router.post("/insumos/update")
async def api_atualizar_insumo(data: dict = Body(None), id: int = Form(None), quantidade: int = Form(None)):
    if data:
        atualizar_quantidade(data["id"], data["quantidade"])
        return {"status": "ok"}
    else:
        atualizar_quantidade(id, quantidade)
        return RedirectResponse("/dashboard#estoque", status_code=303)

@router.post("/insumos/lote/add")
async def api_adicionar_lote(data: dict = Body(None),
    nome: Optional[str] = Form(None),
    insumo_id: Optional[int] = Form(None),
    quantidade: Optional[Decimal] = Form(None),
    unidade: Optional[str] = Form(None),
    lote: Optional[str] = Form(None),
    validade: Optional[str] = Form(None)
):
    if data:
        # JSON (React)
        _insumo_id = data.get("insumo_id")
        _quantidade = data.get("quantidade")
        if not _insumo_id:
            novo_id = criar_insumo(data.get("nome"), _quantidade, data.get("unidade", "un"))
            adicionar_lote(novo_id, _quantidade, data.get("lote"), data.get("validade"))
        else:
            adicionar_lote(_insumo_id, _quantidade, data.get("lote"), data.get("validade"))
        return {"status": "ok"}
    else:
        # Form (templates)
        if not insumo_id:
            novo_id = criar_insumo(nome, quantidade, unidade)
            adicionar_lote(novo_id, quantidade, lote, validade)
        else:
            adicionar_lote(insumo_id, quantidade, lote, validade)
        return RedirectResponse("/dashboard#estoque", status_code=303)

@router.post("/insumos/lote/consumir")
async def api_consumir_lote(data: dict = Body(None), lote_id: int = Form(None), quantidade: float = Form(None)):
    if data:
        consumir_lote(data["lote_id"], data["quantidade"])
        return {"status": "ok"}
    else:
        consumir_lote(lote_id, quantidade)
        return RedirectResponse("/dashboard#estoque", status_code=303)

@router.get("/insumos/{insumo_id}/editar")
async def editar_insumo_page(request: Request, insumo_id: int):
    insumos = listar_insumos()
    insumo = next((i for i in insumos if i["id"] == insumo_id), None)
    return templates.TemplateResponse("editar_insumo.html", {"request": request, "insumo": insumo})

# ==========================================
# ============== PEDIDOS ===================
# ==========================================

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

@pedido_router.post("/{pedido_id}/cancelar")
def api_cancelar_pedido(pedido_id: int):
    """
    Cancela um pedido e devolve os produtos ao estoque.
    Os itens do pedido são devolvidos à tabela insumos (produtos acabados).
    """
    try:
        cancelar_pedido_db(pedido_id)
        return {"status": "cancelado"}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

# ==========================================
# ============= PRODUTOS ===================
# ==========================================

@router.post("/produtos/add")
async def api_adicionar_produto(data: dict = Body(None),
    produto_nome: str = Form(None),
    quantidade: Optional[Decimal] = Form(None),
    lote: str = Form(None),
    validade: str = Form(None)
):
    """
    Registra produto acabado e desconta insumos automaticamente.
    
    JSON body esperado:
    {
        "produto_nome": "Mel 500g",
        "quantidade": 100,
        "lote": "L2024-001",
        "validade": "2025-12-31",
        "insumos_consumidos": [
            {"insumo_id": 1, "quantidade": 100},  // garrafas
            {"insumo_id": 2, "quantidade": 100},  // rótulos
            {"insumo_id": 3, "quantidade": 100}   // tampas
        ]
    }
    """
    if data:
        # JSON (React) - com consumo de insumos
        try:
            novo_id = adicionar_produto_com_insumos(
                produto_nome=data["produto_nome"],
                quantidade=data["quantidade"],
                lote=data["lote"],
                validade=data["validade"],
                insumos_consumidos=data.get("insumos_consumidos", [])
            )
            return {"status": "ok", "produto_id": novo_id}
        except ValueError as e:
            raise HTTPException(status_code=400, detail=str(e))
    else:
        # Form (templates) - comportamento original
        novo_id = criar_insumo(produto_nome, quantidade, "un")
        adicionar_lote(novo_id, float(quantidade), lote, validade)
        return RedirectResponse("/dashboard#estoque", status_code=303)

# ==========================================
# ============= CLIENTES ===================
# ==========================================

@router.get("/clientes/list")
async def api_listar_clientes():
    """Lista todos os clientes cadastrados"""
    return listar_clientes()

@router.post("/clientes/add")
async def api_criar_cliente(data: dict = Body(...)):
    """Cadastra um novo cliente"""
    try:
        cliente_id = criar_cliente(
            nome=data["nome"],
            telefone=data.get("telefone", ""),
            email=data.get("email", ""),
            endereco=data.get("endereco", "")
        )
        return {"id": cliente_id}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/clientes/delete")
async def api_deletar_cliente(data: dict = Body(...)):
    """Remove um cliente"""
    try:
        deletar_cliente_db(data["id"])
        return {"status": "ok"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
