# SGTU - Sistema de Gestão de Transporte Universitário

## 🚌 Sobre o Projeto
O **SGTU** é uma solução de software desenvolvida como projeto de extensão para a disciplina de Engenharia de Software da UFC - Campus Quixadá. O objetivo principal é modernizar, digitalizar e otimizar o fluxo de cadastro e o controle de acesso ao transporte universitário intermunicipal fornecido pela Prefeitura de Boa Viagem para os estudantes que se deslocam até o polo universitário de Quixadá.

O sistema elimina o uso de formulários físicos e listas de papel estáticas, substituindo-os por um fluxo de cadastro online para os estudantes, um painel administrativo para validação ágil de documentos pela Secretaria de Educação e uma relação digital de passageiros atualizada em tempo real para os motoristas da frota municipal.

---

## 👥 Integrantes da Equipe
* **Cleuvya Vitória Oliveira dos Santos**
* **Maykon Wendel dos Santos Silva**
* **Yasmin Lima Costa**

---

## 🔗 Links Externos do Projeto
Para acompanhar os artefatos e o progresso do desenvolvimento do SGTU, acesse os links abaixo:
* **Prototipação de Interface:** https://www.figma.com/proto/wDQGy5mO0hVmFYHZLfJfow/Trabalho-ES?node-id=0-1&t=UerY5wSckJnzJsvA-1
* **Gestão do Projeto & Sprint Planning (Jira Software):** https://sgtu.atlassian.net/jira/software/projects/SGTU/boards/2?atlOrigin=eyJpIjoiYmQ1MGUzOWVkOGIxNDgxOGE2NTQxNjNhZTM0YTZkZmQiLCJwIjoiaiJ9
* **Slides de Apresentação da Proposta (Canva):** https://canva.link/v131ic8v1j2l386

---

## 🏗️ Documento de Arquitetura (Visão Geral)

### Tecnologias Planejadas (Stack Tecnológica)
* **Ambiente de Desenvolvimento:** Ubuntu Linux
* **Linguagem Backend:** Python (FastAPI / Django)
* **Banco de Dados:** MongoDB (Armazenamento de cadastros e status de validação)

### Ambiente do Usuário
* **Estudantes:** Interface Web para upload de declarações e acompanhamento de status.
* **Secretaria de Educação:** Painel Administrativo Desktop para triagem de pendências.
* **Motoristas:** Interface Web minimalista e otimizado para celulares para validação visual da lista de embarque semanal.

---

## 📅 Sprint 1: Concepção, Requisitos e Fundamentação do Ecossistema

Nesta primeira etapa, o foco esteve no mapeamento do domínio do problema junto à Secretaria de Educação, especificação dos requisitos e na construção da base arquitetural e visual do SGTU.

### 📋 Planejamento de Requisitos e Concepção
* **Mapeamento de Domínio:** Validação e alinhamento informal da proposta de transporte universitário com o cliente.
* **Documentação Técnica:** Elaboração do Documento de Requisitos e especificação detalhada das Histórias de Usuário básicas.
* **Repositório Git:** Estruturação e configuração inicial do ambiente de versionamento público.

### 🎨 Frontend & Interface (Do Figma para o Código)
Toda a interface gráfica e a estrutura visual do sistema foram completamente codificadas utilizando **HTML5** e **Tailwind CSS** para um design responsivo.
* **Fidelidade ao Protótipo:** O desenvolvimento das telas seguiu fielmente o protótipo de alta fidelidade desenhado previamente no **Figma**, garantindo consistência na paleta de cores, componentes e fluxo de navegação.
* **Single Page Application (SPA):** As três visões essenciais foram integradas na estrutura base do `index.html`:
  * *Portal do Aluno:* Área de cadastro e envio de arquivos.
  * *Portal Administrativo:* Fila estruturada para a triagem de documentos.
  * *Visão do Motorista:* Painel planejado para a listagem digital de embarque.

### ⚙️ Backend & Rotas Iniciais (FastAPI + Python)
Modelagem inicial do banco de dados não-relacional utilizando **MongoDB** e criação dos primeiros serviços da API com **FastAPI**:
* **POST `/cadastro`:** Rota responsável por receber os dados do formulário do estudante via `FormData`, salvar o arquivo PDF de comprovante de forma segura no servidor local e registrar o documento no MongoDB com o status inicial de `"Pendente"`.
* **GET `/pendencias`:** Rota responsável por consultar o banco de dados e retornar apenas os registros pendentes de validação para alimentar a fila da Secretaria.
