from fastapi import Request, status
from fastapi.responses import RedirectResponse, JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from app.auth import decode_jwt_token

PUBLIC_PATHS = ["/login", "/", "/api/auth/login"]


class AuthMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        path = request.url.path

        # arquivos estáticos
        if path.startswith("/static"):
            return await call_next(request)

        # rotas públicas
        if path in PUBLIC_PATHS:
            return await call_next(request)

        token = None

        # 1) tenta header Authorization (React)
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            token = auth_header.replace("Bearer ", "").strip()

        # 2) fallback cookie legado
        if not token:
            token = request.cookies.get("token")

        # sem token
        if not token:
            if path.startswith("/api"):
                return JSONResponse(
                    {"detail": "Não autenticado"},
                    status_code=401
                )
            return RedirectResponse("/login", status_code=status.HTTP_303_SEE_OTHER)

        payload = decode_jwt_token(token)

        if not payload:
            if path.startswith("/api"):
                return JSONResponse(
                    {"detail": "Token inválido"},
                    status_code=401
                )

            response = RedirectResponse("/login", status_code=status.HTTP_303_SEE_OTHER)
            response.delete_cookie("token")
            return response

        request.state.user = payload["sub"]

        return await call_next(request)