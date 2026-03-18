from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from dotenv import load_dotenv

from app.middleware import AuthMiddleware
from app import routes

load_dotenv()

app = FastAPI()

app.add_middleware(AuthMiddleware)

app.mount("/static", StaticFiles(directory="app/static"), name="static")

app.include_router(routes.router)