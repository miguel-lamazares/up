from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from dotenv import load_dotenv

from app.middleware import AuthMiddleware
from app.routes import router, pedido_router, auth_router, cliente_router

from app.routes import router, pedido_router

load_dotenv()

from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:8080"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_middleware(AuthMiddleware)

# rotas template/jinja
app.include_router(router)

# api pedidos
app.include_router(pedido_router, prefix="/api")

# auth api já possui prefix /api/auth
app.include_router(auth_router)
app.include_router(cliente_router)

app.mount("/static", StaticFiles(directory="app/static"), name="static")