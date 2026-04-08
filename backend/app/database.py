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
        cursor_factory=RealDictCursor,
    )


# ------------------ INSUMOS ------------------

def listar_insumos():
    with get_db_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT id, nome, quantidade, unidade FROM insumos ORDER BY nome"
            )
            return cur.fetchall()


def criar_insumo(nome: str, quantidade: Decimal, unidade: str):
    with get_db_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "INSERT INTO insumos (nome, quantidade, unidade) VALUES (%s, %s, %s) RETURNING id",
                (nome, quantidade, unidade),
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

            cur.execute(
                "UPDATE insumos SET quantidade = %s WHERE id = %s",
                (nova_quantidade, insumo_id),
            )
            conn.commit()


# ------------------ LOTES ------------------

def adicionar_lote(insumo_id: int, quantidade: float, lote: str = None, validade: str = None):
    with get_db_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "INSERT INTO lotes_insumo (insumo_id, quantidade, lote, validade) VALUES (%s, %s, %s, %s)",
                (insumo_id, quantidade, lote, validade),
            )
            cur.execute(
                "UPDATE insumos SET quantidade = quantidade + %s WHERE id = %s",
                (quantidade, insumo_id),
            )
            conn.commit()


def listar_lotes(insumo_id: int):
    with get_db_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT id, lote, quantidade, validade FROM lotes_insumo WHERE insumo_id = %s ORDER BY validade ASC NULLS LAST",
                (insumo_id,),
            )
            return cur.fetchall()


def consumir_lote(lote_id: int, quantidade: float):
    if quantidade <= 0:
        raise ValueError("Quantidade deve ser maior que zero")

    with get_db_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT id, insumo_id, quantidade FROM lotes_insumo WHERE id = %s",
                (lote_id,),
            )
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
                cur.execute(
                    "UPDATE lotes_insumo SET quantidade = %s WHERE id = %s",
                    (restante, lote_id),
                )

            cur.execute(
                "UPDATE insumos SET quantidade = quantidade - %s WHERE id = %s",
                (quantidade, lote["insumo_id"]),
            )
            conn.commit()


def consumir_estoque_fefo(insumo_id: int, quantidade: float):
    restante = float(quantidade)

    with get_db_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT id, quantidade FROM lotes_insumo WHERE insumo_id = %s ORDER BY validade ASC NULLS LAST, id ASC",
                (insumo_id,),
            )
            lotes = cur.fetchall()

            for lote in lotes:
                if restante <= 0:
                    break

                disponivel = float(lote["quantidade"])
                consumir = min(disponivel, restante)
                novo_valor = disponivel - consumir

                if novo_valor == 0:
                    cur.execute("DELETE FROM lotes_insumo WHERE id = %s", (lote["id"],))
                else:
                    cur.execute(
                        "UPDATE lotes_insumo SET quantidade = %s WHERE id = %s",
                        (novo_valor, lote["id"]),
                    )

                restante -= consumir

            if restante > 0:
                raise ValueError("Estoque insuficiente no FEFO")

            cur.execute(
                "UPDATE insumos SET quantidade = quantidade - %s WHERE id = %s",
                (quantidade, insumo_id),
            )
            conn.commit()


# ------------------ USUÁRIOS ------------------

def buscar_usuario_por_username(username: str):
    with get_db_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT id, username, password FROM usuarios WHERE username=%s",
                (username,),
            )
            return cur.fetchone()


def registrar_login(username: str, ip: str, success: bool):
    with get_db_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "INSERT INTO login_logs (username, ip, success) VALUES (%s, %s, %s)",
                (username, ip, success),
            )
            conn.commit()


# ------------------ CLIENTES ------------------

def listar_clientes():
    with get_db_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT id, nome, telefone, endereco FROM clientes ORDER BY nome"
            )
            return cur.fetchall()


def criar_cliente(nome: str, telefone: str = None, endereco: str = None):
    with get_db_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "INSERT INTO clientes (nome, telefone, endereco) VALUES (%s, %s, %s) RETURNING id",
                (nome, telefone, endereco),
            )
            cliente_id = cur.fetchone()["id"]
            conn.commit()
            return cliente_id


def deletar_cliente(cliente_id: int):
    with get_db_connection() as conn:
        with conn.cursor() as cur:
            cur.execute("DELETE FROM clientes WHERE id = %s", (cliente_id,))
            conn.commit()


# ------------------ PEDIDOS ------------------

def criar_pedido(cliente: str, forma_pagamento: str, valor_total: float, itens: list):
    with get_db_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "INSERT INTO pedidos (cliente, forma_pagamento, valor_total, status) VALUES (%s, %s, %s, %s) RETURNING id",
                (cliente, forma_pagamento, valor_total, "em_andamento"),
            )
            pedido_id = cur.fetchone()["id"]

            for item in itens:
                cur.execute(
                    "INSERT INTO pedido_itens (pedido_id, produto_id, quantidade, valor_unitario) VALUES (%s, %s, %s, %s)",
                    (
                        pedido_id,
                        item["produto_id"],
                        item["quantidade"],
                        item["valor_unitario"],
                    ),
                )
                consumir_estoque_fefo(item["produto_id"], item["quantidade"])

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
                (pedido_id,),
            )
            return cur.fetchone()


def cancelar_pedido_e_devolver_estoque(pedido_id: int):
    with get_db_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT status FROM pedidos WHERE id = %s",
                (pedido_id,),
            )
            pedido = cur.fetchone()
            if not pedido:
                raise ValueError("Pedido não encontrado")

            if pedido["status"] == "cancelado":
                return

            cur.execute(
                "SELECT produto_id, quantidade FROM pedido_itens WHERE pedido_id = %s",
                (pedido_id,),
            )
            itens = cur.fetchall()

            for item in itens:
                cur.execute(
                    "UPDATE insumos SET quantidade = quantidade + %s WHERE id = %s",
                    (item["quantidade"], item["produto_id"]),
                )
                cur.execute(
                    "INSERT INTO lotes_insumo (insumo_id, quantidade, lote, validade) VALUES (%s, %s, %s, %s)",
                    (item["produto_id"], item["quantidade"], "RETORNO_CANCELAMENTO", None),
                )

            cur.execute(
                "UPDATE pedidos SET status = %s WHERE id = %s",
                ("cancelado", pedido_id),
            )
            conn.commit()
