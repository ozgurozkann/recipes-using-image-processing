#!/usr/bin/env bash
set -euo pipefail

CMD="${1:-import}"

MYSQL_HOST="${MYSQL_HOST:-127.0.0.1}"
MYSQL_PORT="${MYSQL_PORT:-3306}"
MYSQL_USER="${MYSQL_USER:-root}"
MYSQL_PASSWORD="${MYSQL_PASSWORD:-root}"
MYSQL_DATABASE="${MYSQL_DATABASE:-recipes_db}"
SEED_SQL="${SEED_SQL:-backend/seed.sql}"

MYSQL_BIN="${MYSQL_BIN:-mysql}"
MYSQLDUMP_BIN="${MYSQLDUMP_BIN:-mysqldump}"

mysql_args=(
  --host="$MYSQL_HOST"
  --port="$MYSQL_PORT"
  --user="$MYSQL_USER"
  --default-character-set=utf8mb4
)

dump_args=(
  "${mysql_args[@]}"
  --single-transaction
  --skip-triggers
  --complete-insert
  --skip-add-locks
)

schema_tables=(
  users
  ingredient_categories
  ingredients
  recipe_categories
  recipes
  recipe_ingredients
  favorite_recipes
  saved_recipes
  user_uploaded_images
)

data_tables=(
  ingredient_categories
  ingredients
  recipe_categories
  recipes
  recipe_ingredients
)

require_cmd() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "Missing command: $1" >&2
    exit 1
  fi
}

dump_seed() {
  require_cmd "$MYSQLDUMP_BIN"
  mkdir -p "$(dirname "$SEED_SQL")"

  {
    echo "-- Recipes seed data"
    echo "-- Source: ${MYSQL_HOST}:${MYSQL_PORT}/${MYSQL_DATABASE}"
    echo "SET NAMES utf8mb4;"
    echo "SET FOREIGN_KEY_CHECKS=0;"
    echo

    MYSQL_PWD="$MYSQL_PASSWORD" "$MYSQLDUMP_BIN" "${mysql_args[@]}" \
      --no-data \
      --skip-triggers \
      --add-drop-table \
      "$MYSQL_DATABASE" "${schema_tables[@]}"

    MYSQL_PWD="$MYSQL_PASSWORD" "$MYSQLDUMP_BIN" "${dump_args[@]}" \
      --no-create-info \
      "$MYSQL_DATABASE" users --where="email='admin@example.com'"

    MYSQL_PWD="$MYSQL_PASSWORD" "$MYSQLDUMP_BIN" "${dump_args[@]}" \
      --no-create-info \
      "$MYSQL_DATABASE" "${data_tables[@]}"

    echo "SET FOREIGN_KEY_CHECKS=1;"
  } > "$SEED_SQL"

  echo "Seed SQL written: $SEED_SQL"
}

import_seed() {
  require_cmd "$MYSQL_BIN"

  if [[ ! -f "$SEED_SQL" ]]; then
    echo "Seed SQL not found: $SEED_SQL" >&2
    exit 1
  fi

  MYSQL_PWD="$MYSQL_PASSWORD" "$MYSQL_BIN" "${mysql_args[@]}" "$MYSQL_DATABASE" < "$SEED_SQL"
  echo "Seed SQL imported into ${MYSQL_HOST}:${MYSQL_PORT}/${MYSQL_DATABASE}"
}

case "$CMD" in
  dump)
    dump_seed
    ;;
  import)
    import_seed
    ;;
  *)
    echo "Usage: $0 [dump|import]" >&2
    echo "Environment: MYSQL_HOST MYSQL_PORT MYSQL_USER MYSQL_PASSWORD MYSQL_DATABASE SEED_SQL" >&2
    exit 1
    ;;
esac
