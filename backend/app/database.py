import os
import psycopg2
from psycopg2.extras import RealDictCursor
from app.config import JWT_SECRET_KEY, JWT_ALGORITHM, JWT_EXPIRATION_MINUTES

DB_HOST = os.getenv("DB_HOST")
DB_NAME = os.getenv("DB_NAME")
DB_USER = os.getenv("DB_USER")
DB_PASSWORD = os.getenv("DB_PASSWORD")

def listar_insumos():
    conn = get_db_connection()
    cur = conn.cursor()

    cur.execute("SELECT id, nome, quantidade, unidade FROM insumos ORDER BY nome")
    data = cur.fetchall()

    conn.close()
    return data

def criar_insumo(nome, quantidade, unidade):
    conn = get_db_connection()
    cur = conn.cursor()

    cur.execute(
        "INSERT INTO insumos (nome, quantidade, unidade) VALUES (%s, %s, %s)",
        (nome, quantidade, unidade)
    )

    conn.commit()
    conn.close()

def deletar_insumo_db(id):
    conn = get_db_connection()
    cur = conn.cursor()

    cur.execute("DELETE FROM insumos WHERE id = %s", (id,))

    conn.commit()
    conn.close()

def atualizar_quantidade(id, quantidade):
    conn = get_db_connection()
    cur = conn.cursor()

    cur.execute(
        "UPDATE insumos SET quantidade = %s WHERE id = %s",
        (quantidade, id)
    )

    conn.commit()
    conn.close()


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
                "SELECT id, username, password FROM usuarios WHERE username=%s",
                (username,)
            )
            return cur.fetchone()
    finally:
        conn.close()

def registrar_login(username, ip, success):
    conn = get_db_connection()
    try:
        with conn.cursor() as cur:
            cur.execute(
                """
                INSERT INTO login_logs (username, ip, success)
                VALUES (%s,%s,%s)
                """,
                (username, ip, success)
            )
            conn.commit()
    finally:
        conn.close()


