import os
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware

from .routes import cadastro, auth


app = FastAPI(title="SGTU API", version="1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "uploads"))
app.mount("/arquivos", StaticFiles(directory=UPLOAD_DIR), name="uploads")

# Rotas
app.include_router(cadastro.router)
app.include_router(auth.router, tags=["Autenticação"])

@app.get("/")
def home():
    return {"mensagem": "API do SGTU rodando com sucesso!"}