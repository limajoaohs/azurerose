# Bem-vindo(a) ao AzureRose

> *"Clear vision to make the impossible possible."*

Este guia é para quem está entrando no projeto agora. O objetivo é você conseguir rodar o AzureRose localmente e entender o estado atual em poucos minutos.

## O que é o projeto

AzureRose é um workspace de hiperprodutividade estudantil: editor de notas com Markdown/KaTeX, mapas mentais gerados por IA ("O Olho"), flashcards com repetição espaçada, cronograma de provas, upload de ementa em PDF, e um modo de foco (Pomodoro). Tudo isolado por conta de usuário.

A identidade visual é **Azul, Preto e Branco** — o emblema é uma rosa azul. Não use rosa/pink em nenhum componente novo.

## Arquitetura

```
AZUREROSE/
├── backend/     FastAPI + SQLAlchemy async + PostgreSQL
└── frontend/    React + Vite + Tailwind + React Flow
```

- **Backend**: Python/FastAPI, banco PostgreSQL (com extensão `pgvector` habilitada para o RAG semântico que vem a seguir no roadmap). Autenticação via JWT.
- **Frontend**: React + Vite (não Next.js) + Tailwind, editor em Markdown com KaTeX, React Flow para os mapas mentais.
- **IA**: camada plugável (`backend/app/ai/`) — hoje configurada em modo `mock` (zero-config, não precisa de chave de API). Dá pra trocar para Gemini, OpenAI-compatível (OpenAI/DeepSeek/Groq) ou um modelo local (vLLM/Ollama) via `.env`.

## Como rodar localmente

### 1. Pré-requisitos
- Python 3.11+ e Node 20+
- PostgreSQL rodando localmente (com a extensão `pgvector`)

### 2. Banco de dados (uma vez só, na sua máquina)
Cada pessoa do time roda o próprio Postgres local — não compartilhamos senha de banco entre máquinas.

```bash
sudo apt install -y postgresql-17-pgvector   # ou a versão do seu Postgres
sudo -u postgres psql -c "CREATE ROLE azurerose WITH LOGIN PASSWORD 'escolha_uma_senha';"
sudo -u postgres psql -c "CREATE DATABASE azurerose OWNER azurerose;"
sudo -u postgres psql -d azurerose -c "CREATE EXTENSION IF NOT EXISTS vector;"
```

### 3. Backend
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
```
Edite o `.env` recém-criado:
- `DATABASE_URL` com a senha que você escolheu acima
- `SECRET_KEY` — gere a sua própria, nunca reaproveite a de outra pessoa: `python -c "import secrets; print(secrets.token_hex(32))"`

```bash
uvicorn app.main:app --reload --port 8000
```
Isso já cria as tabelas automaticamente. API em `http://localhost:8000`, docs Swagger em `/docs`.

### 4. Frontend
```bash
cd frontend
npm install
npm run dev
```
App em `http://localhost:3000`.

### 5. Ou os dois juntos
Da raiz do projeto: `./dev.sh`

### 6. Testes do backend
```bash
cd backend
PYTHONPATH=. venv/bin/pytest -v tests
```
Os testes rodam isolados em SQLite (não tocam no seu Postgres de desenvolvimento).

## Primeiro uso

1. Abra `http://localhost:3000`, clique em **Criar conta** e cadastre seu usuário (fica isolado — cada conta só vê os próprios dados).
2. No primeiro login, o app cria automaticamente uma disciplina, uma nota e algumas tarefas de exemplo pra você explorar.

## Convenções do projeto

- **Cores**: só Azul (`blue-*`/`sky-*`/`cyan-*`), Preto/Neutro (`slate-*`/`black`/`white`). Nada de `rose`, `pink`, `emerald`, `violet`, `teal` — se precisar de um segundo tom de destaque, use `sky-*`; para ênfase/urgência, use branco puro sobre fundo escuro em vez de vermelho.
- **Backend**: cada endpoint segue o mesmo padrão — schema Pydantic simples, `Depends(get_db)` + `Depends(get_current_user)`, toda query filtrada por `user_id` do usuário logado.
- **Segredos**: `.env` nunca é commitado (está no `.gitignore`). Se adicionar uma variável nova, atualize também o `.env.example` com um valor placeholder.
- Sem testes de frontend ainda — se adicionar um componente complexo, considere isso.

## Onde estamos / próximos passos

O roadmap completo está registrado no histórico do projeto. Resumo do que já existe vs. o que falta:

**Já pronto**: autenticação multiusuário, editor + KaTeX, cadernos por disciplina, cronograma de prazos, mapas mentais por IA, resumo de notas por IA, flashcards com SRS (SM-2), upload de ementa em PDF com geração de cronograma, Modo Hiperfoco completo (ciclos foco/pausa, meta de sessão, modo tela cheia).

**Ainda não construído**: RAG semântico sobre as próprias anotações (o `pgvector` já está habilitado no banco, falta o pipeline de embeddings), painel de métricas/desempenho, compartilhamento/colaboração de cadernos entre usuários, deploy em produção, testes de frontend.

## Dúvidas

Fala direto comigo (João). Bem-vindo(a) a bordo.
