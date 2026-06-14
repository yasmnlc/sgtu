@router.post("/cadastro")
async def cadastrar_estudante(
    nome_completo: str = Form(...),
    cpf: str = Form(...), 
    universidade: str = Form(...),
    curso: str = Form(...),
    arquivo: UploadFile = File(...),
    db = Depends(get_db)
):
    # Validação do CPF: Remove caracteres não numéricos e verifica se tem 11 dígitos
    cpf_limpo = "".join(filter(str.isdigit, cpf))
    
    if len(cpf_limpo) != 11:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="O CPF deve conter exatamente 11 dígitos numéricos."
        )

    # Restringe tipo de arquivo para APENAS .PDF
    extensao = os.path.splitext(arquivo.filename)[1].lower()
    if extensao != ".pdf" or arquivo.content_type != "application/pdf":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Tipo de arquivo inválido. Apenas documentos em formato .PDF são permitidos."
        )

    # Definimos o caminho do arquivo (mas salvaremos apenas se o banco aceitar o CPF)
    caminho_arquivo = os.path.join(UPLOAD_DIR, f"{cpf_limpo}_{arquivo.filename}")

    novo_estudante = {
        "nome_completo": nome_completo,
        "cpf": cpf_limpo,
        "universidade": universidade,
        "curso": curso,
        "documento_url": caminho_arquivo,
        "status": "Pendente",
        "data_envio": datetime.now(),
        "justificativa_recusa": ""
    }

    try:
        colecao = db["estudantes"]
        # Se o CPF for duplicado, o índice único criado no database.py vai disparar o erro bem aqui
        colecao.insert_one(novo_estudante)
        
        # Agora sim salvamos o arquivo de forma segura
        with open(caminho_arquivo, "wb") as buffer:
            shutil.copyfileobj(arquivo.file, buffer)
            
    except DuplicateKeyError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Este CPF já possui um cadastro em andamento no sistema."
        )

    return {"status": "Sucesso", "mensagem": "Cadastro e declaração em PDF recebidos com sucesso!"}
