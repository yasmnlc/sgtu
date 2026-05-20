from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .routes import cadastro

app = FastAPI(title="SGTU API", version="1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Rotas
app.include_router(cadastro.router)

@app.get("/")
def home():
    return {"mensagem": "API do SGTU rodando com sucesso!"}