from fastapi import APIRouter, Request, Form
from fastapi.responses import HTMLResponse, RedirectResponse
from fastapi.templating import Jinja2Templates

router = APIRouter()
templates = Jinja2Templates(directory="templates")


# ===== LOGIN PAGE =====
@router.get("/", response_class=HTMLResponse)
async def login_page(request: Request):
    return templates.TemplateResponse(
        "login.html",
        {"request": request, "error": False}
    )


# ===== LOGIN PROCESS =====
@router.post("/login")
async def login(
    request: Request,
    username: str = Form(...),
    password: str = Form(...)
):
    # Login fake só para teste
    if username == "admin" and password == "123":
        response = RedirectResponse(url="/dashboard", status_code=303)
        response.set_cookie(key="user", value=username)
        return response

    return templates.TemplateResponse(
        "login.html",
        {"request": request, "error": True}
    )


# ===== DASHBOARD =====
@router.get("/dashboard", response_class=HTMLResponse)
async def dashboard(request: Request):
    user = request.cookies.get("user")

    if not user:
        return RedirectResponse(url="/")

    return templates.TemplateResponse(
        "dashboard.html",
        {"request": request, "user": user}
    )


# ===== LOGOUT =====
@router.get("/logout")
async def logout():
    response = RedirectResponse(url="/")
    response.delete_cookie("user")
    return response