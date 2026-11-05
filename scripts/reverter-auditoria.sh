#!/usr/bin/env bash
# Desfaz uma auditoria ja publicada no site, devolvendo os arquivos ao estado
# anterior. Cada execucao da auditoria gera um unico commit, cujo codigo vem
# no relatorio enviado ao escritorio.
#
# Uso: ./scripts/reverter-auditoria.sh <codigo-do-commit>
set -euo pipefail

if [ $# -ne 1 ]; then
  echo "Informe o codigo do commit da auditoria. Exemplo:" >&2
  echo "  ./scripts/reverter-auditoria.sh 32af671" >&2
  exit 1
fi

git fetch origin main
git checkout main
git pull --ff-only origin main
git revert --no-edit "$1"
git push origin HEAD:main
echo "Auditoria $1 revertida e enviada ao site."
