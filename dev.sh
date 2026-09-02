#!/usr/bin/env bash

# A revisão do snap do VS Code muda a cada atualização (257, 258, 259...), então
# localiza o binário do fnm em vez de fixar um caminho que fica obsoleto sozinho.
FNM_BIN="$(find "$HOME"/snap/code/*/.local/share/fnm/fnm "$HOME"/.local/share/fnm/fnm -maxdepth 0 -type f 2>/dev/null | sort -V | tail -n1)"
if [ -n "$FNM_BIN" ]; then
  eval "$("$FNM_BIN" env --shell bash)"
  "$FNM_BIN" use --silent-if-unchanged default 2>/dev/null || "$FNM_BIN" use --silent-if-unchanged v24.19.0 2>/dev/null
fi

echo "Iniciando AzureRose..."

(
  cd backend || exit
  source venv/bin/activate
  echo "[Backend] Rodando em http://localhost:8000 (Swagger: http://localhost:8000/docs)"
  uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
) &
BACKEND_PID=$!

(
  cd frontend || exit
  echo "[Frontend] Rodando em http://localhost:3000"
  npm run dev
) &
FRONTEND_PID=$!

trap "kill $BACKEND_PID $FRONTEND_PID; exit" SIGINT SIGTERM EXIT
wait
