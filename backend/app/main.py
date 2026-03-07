from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from middleware import AuthMiddleware
import routes

app = FastAPI()

app.add_middleware(AuthMiddleware)

app.mount("/static", StaticFiles(directory="app/static"), name="static")

app.get("/", response_class=None)(routes.login_page)
app.get("/login")(routes.login_page)
app.post("/login")(routes.login)

app.get("/dashboard")(routes.dashboard)

app.get("/logout")(routes.logout)