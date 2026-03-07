from fastapi import Request, status
from fastapi.responses import RedirectResponse
from starlette.middleware.base import BaseHTTPMiddleware
from app.auth import decode_jwt_token

PUBLIC_PATHS = ["/login", "/", "/logout"]

class AuthMiddleware(BaseHTTPMiddleware):

    async def dispatch(self, request: Request, call_next):

        path = request.url.path

        if path.startswith("/static"):
            return await call_next(request)

        if path in PUBLIC_PATHS:
            return await call_next(request)

        token = request.cookies.get("token")

        if not token:
            return RedirectResponse("/login", status_code=status.HTTP_303_SEE_OTHER)

        payload = decode_jwt_token(token)

        if not payload:
            response = RedirectResponse("/login", status_code=status.HTTP_303_SEE_OTHER)
            response.delete_cookie("token")
            return response

        request.state.user = payload["sub"]

        return await call_next(request)