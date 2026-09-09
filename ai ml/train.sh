#!/usr/bin/env sh
set -eu

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
PROJECT_ROOT=$(CDPATH= cd -- "$SCRIPT_DIR/.." && pwd)
VENV_PYTHON="$PROJECT_ROOT/.venv/bin/python"

if [ -x "$VENV_PYTHON" ]; then
    exec "$VENV_PYTHON" "$SCRIPT_DIR/train_model.py" "$@"
fi

if command -v python3 >/dev/null 2>&1; then
    exec python3 "$SCRIPT_DIR/train_model.py" "$@"
fi

printf '%s\n' "Python 3 is required. Create the project environment with:" >&2
printf '%s\n' "  python3 -m venv \"$PROJECT_ROOT/.venv\"" >&2
printf '%s\n' "  \"$PROJECT_ROOT/.venv/bin/python\" -m pip install -r \"$SCRIPT_DIR/requirements.txt\"" >&2
exit 1
