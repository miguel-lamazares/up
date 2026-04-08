import os
import psycopg2
from psycopg2.extras import RealDictCursor
from decimal import Decimal

DB_HOST = os.getenv("DB_HOST")
DB_NAME = os.getenv("DB_NAME")
DB_USER = os.getenv("DB_USER")
DB_PASSWORD = os.getenv("DB_PASSWORD")

def get_db_connection():
    return psycopg2.connect(
        host=DB_HOST,
        database=DB_NAME,
        user=DB_USER,
        password=DB_PASSWORD,
        cursor_factory=RealDictCursor
    )

# ------------------ INSUMOS ------------------

def listar_insumos():
    with get_db_connection() as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT id, nome, quantidade, unidade FROM insumos ORDER BY nome")
            return cur.fetchall()

def criar_insumo(nome: str, quantidade: Decimal, unidade: str):
    with get_db_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "INSERT INTO insumos (nome, quantidade, unidade) VALUES (%s, %s, %s) RETURNING id",
                (nome, quantidade, unidade)
            )
            novo_id = cur.fetchone()["id"]
            conn.commit()
            return novo_id

def deletar_insumo_db(insumo_id: int):
    with get_db_connection() as conn:
        with conn.cursor() as cur:
            cur.execute("DELETE FROM insumos WHERE id = %s", (insumo_id,))
            conn.commit()

def atualizar_quantidade(insumo_id: int, quantidade: float):
    with get_db_connection() as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT quantidade FROM insumos WHERE id = %s", (insumo_id,))
            row = cur.fetchone()
            if not row:
                raise ValueError(f"Insumo com id {insumo_id} não encontrado")

            atual = float(row["quantidade"])
            nova_quantidade = atual + quantidade

            if nova_quantidade < 0:
                raise ValueError("Estoque não pode ficar negativo")

            cur.execute("UPDATE insumos SET quantidade = %s WHERE id = %s", (nova_quantidade, insumo_id))
            conn.commit()

# ------------------ LOTES ------------------

def adicionar_lote(insumo_id: int, quantidade: float, lote: str = None, validade: str = None):
    with get_db_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "INSERT INTO lotes_insumo (insumo_id, quantidade, lote, validade) VALUES (%s, %s, %s, %s)",
                (insumo_id, quantidade, lote, validade)
            )
            conn.commit()

def listar_lotes(insumo_id: int):
    with get_db_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT id, lote, quantidade, validade FROM lotes_insumo WHERE insumo_id = %s ORDER BY validade ASC NULLS LAST",
                (insumo_id,)
            )
            return cur.fetchall()

def consumir_lote(lote_id: int, quantidade: float):
    if quantidade <= 0:
        raise ValueError("Quantidade deve ser maior que zero")

    with get_db_connection() as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT quantidade FROM lotes_insumo WHERE id = %s", (lote_id,))
            lote = cur.fetchone()
            if not lote:
                raise ValueError("Lote não encontrado")

            atual = float(lote["quantidade"])
            if quantidade > atual:
                raise ValueError(f"Consumo maior que estoque do lote. Disponível: {atual}")

            restante = atual - quantidade
            if restante == 0:
                cur.execute("DELETE FROM lotes_insumo WHERE id = %s", (lote_id,))
            else:
                cur.execute("UPDATE lotes_insumo SET quantidade = %s WHERE id = %s", (restante, lote_id))

            conn.commit()

# ------------------ USUÁRIOS / LOGIN ------------------

def buscar_usuario_por_username(username: str):
    with get_db_connection() as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT id, username, password FROM usuarios WHERE username=%s", (username,))
            return cur.fetchone()

def registrar_login(username: str, ip: str, success: bool):
    with get_db_connection() as conn:
        with conn.cursor() as cur:
            cur.execute("INSERT INTO login_logs (username, ip, success) VALUES (%s, %s, %s)",
                (username, ip, success))
            conn.commit()

# ------------------ PEDIDOS ------------------

def criar_pedido(cliente: str, forma_pagamento: str, valor_total: float, itens: list):
    """
    itens: lista de dicts [{'produto_id': 1, 'quantidade': 2, 'valor_unitario': 12.50}, ...]
    """
    with get_db_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "INSERT INTO pedidos (cliente, forma_pagamento, valor_total) VALUES (%s, %s, %s) RETURNING id",
                (cliente, forma_pagamento, valor_total)
            )
            pedido_id = cur.fetchone()["id"]

            for item in itens:
                cur.execute(
                    "INSERT INTO pedido_itens (pedido_id, produto_id, quantidade, valor_unitario) VALUES (%s, %s, %s, %s)",
                    (pedido_id, item["produto_id"], item["quantidade"], item["valor_unitario"])
                )

            conn.commit()
            return pedido_id

def listar_pedidos():
    with get_db_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """SELECT p.id, p.cliente, p.forma_pagamento, p.valor_total, p.status, p.data_pedido,
                json_agg(json_build_object('produto_id', pi.produto_id, 'quantidade', pi.quantidade, 'valor_unitario', pi.valor_unitario)) AS itens
                FROM pedidos p
                LEFT JOIN pedido_itens pi ON p.id = pi.pedido_id
                GROUP BY p.id
                ORDER BY p.data_pedido DESC"""
            )
            return cur.fetchall()

def obter_pedido(pedido_id: int):
    with get_db_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """SELECT p.id, p.cliente, p.forma_pagamento, p.valor_total, p.status, p.data_pedido,
                json_agg(json_build_object('produto_id', pi.produto_id, 'quantidade', pi.quantidade, 'valor_unitario', pi.valor_unitario)) AS itens
                FROM pedidos p
                LEFT JOIN pedido_itens pi ON p.id = pi.pedido_id
                WHERE p.id = %s
                GROUP BY p.id""",
                (pedido_id,)
            )
            return cur.fetchone()

# ==========================================
# ========== NOVOS ENDPOINTS ===============
# ==========================================

# ------------------ CANCELAR PEDIDO ------------------

def cancelar_pedido_db(pedido_id: int):
    """
    Cancela um pedido e devolve os produtos ao estoque.
    - Atualiza o status do pedido para 'cancelado'
    - Para cada item do pedido, soma a quantidade de volta ao insumo/produto correspondente
    """
    with get_db_connection() as conn:
        with conn.cursor() as cur:
            # Verificar se o pedido existe e não está já cancelado
            cur.execute("SELECT status FROM pedidos WHERE id = %s", (pedido_id,))
            pedido = cur.fetchone()
            if not pedido:
                raise ValueError("Pedido não encontrado")
            if pedido["status"] == "cancelado":
                raise ValueError("Pedido já está cancelado")

            # Buscar itens do pedido para devolver ao estoque
            cur.execute(
                "SELECT produto_id, quantidade FROM pedido_itens WHERE pedido_id = %s",
                (pedido_id,)
            )
            itens = cur.fetchall()

            # Devolver cada produto ao estoque (tabela insumos, pois produtos são insumos com unidade 'un')
            for item in itens:
                cur.execute(
                    "UPDATE insumos SET quantidade = quantidade + %s WHERE id = %s",
                    (item["quantidade"], item["produto_id"])
                )

            # Atualizar status do pedido
            cur.execute(
                "UPDATE pedidos SET status = 'cancelado' WHERE id = %s",
                (pedido_id,)
            )
            conn.commit()

# ------------------ CLIENTES ------------------

def listar_clientes():
    with get_db_connection() as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT id, nome, telefone, email, endereco FROM clientes ORDER BY nome")
            return cur.fetchall()

def criar_cliente(nome: str, telefone: str, email: str, endereco: str):
    with get_db_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "INSERT INTO clientes (nome, telefone, email, endereco) VALUES (%s, %s, %s, %s) RETURNING id",
                (nome, telefone, email, endereco)
            )
            novo_id = cur.fetchone()["id"]
            conn.commit()
            return novo_id

def deletar_cliente_db(cliente_id: int):
    with get_db_connection() as conn:
        with conn.cursor() as cur:
            cur.execute("DELETE FROM clientes WHERE id = %s", (cliente_id,))
            conn.commit()

# ------------------ PRODUTOS (com consumo de insumos) ------------------

def adicionar_produto_com_insumos(produto_nome: str, quantidade: float, lote: str, validade: str, insumos_consumidos: list):
    """
    Registra um produto acabado e desconta automaticamente os insumos utilizados.
    
    insumos_consumidos: [{'insumo_id': 1, 'quantidade': 10}, ...]
    
    Fluxo:
    1. Cria o produto na tabela insumos (com unidade 'un')
    2. Adiciona o lote correspondente
    3. Desconta cada insumo consumido do estoque
    """
    with get_db_connection() as conn:
        with conn.cursor() as cur:
            # 1. Criar o produto (ou atualizar se já existir)
            novo_id = None
            cur.execute(
                "INSERT INTO insumos (nome, quantidade, unidade) VALUES (%s, %s, %s) RETURNING id",
                (produto_nome, quantidade, "un")
            )
            novo_id = cur.fetchone()["id"]

            # 2. Adicionar lote
            cur.execute(
                "INSERT INTO lotes_insumo (insumo_id, quantidade, lote, validade) VALUES (%s, %s, %s, %s)",
                (novo_id, quantidade, lote, validade)
            )

            # 3. Descontar insumos consumidos
            for insumo in insumos_consumidos:
                insumo_id = insumo["insumo_id"]
                qtd = insumo["quantidade"]

                # Verificar estoque disponível
                cur.execute("SELECT quantidade FROM insumos WHERE id = %s", (insumo_id,))
                row = cur.fetchone()
                if not row:
                    raise ValueError(f"Insumo {insumo_id} não encontrado")
                
                disponivel = float(row["quantidade"])
                if qtd > disponivel:
                    raise ValueError(
                        f"Estoque insuficiente para insumo {insumo_id}. "
                        f"Disponível: {disponivel}, Solicitado: {qtd}"
                    )

                cur.execute(
                    "UPDATE insumos SET quantidade = quantidade - %s WHERE id = %s",
                    (qtd, insumo_id)
                )

            conn.commit()
            return novo_id
