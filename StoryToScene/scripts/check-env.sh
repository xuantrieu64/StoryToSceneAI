#!/usr/bin/env bash
set -euo pipefail

root_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
root_env="$root_dir/.env"
root_example="$root_dir/.env.example"
backend_env="$root_dir/backend/.env"
backend_example="$root_dir/backend/.env.example"

for file in "$root_env" "$root_example" "$backend_env" "$backend_example"; do
    if [[ ! -f "$file" ]]; then
        printf 'Missing required file: %s\n' "${file#"$root_dir"/}" >&2
        exit 1
    fi
done

read_env_value() {
    local file="$1"
    local key="$2"
    local value

    if ! value="$(awk -v key="$key" '
        {
            line = $0
            sub(/\r$/, "", line)
            if (line ~ /^[[:space:]]*#/) next
            equals = index(line, "=")
            if (!equals) next
            name = substr(line, 1, equals - 1)
            gsub(/^[[:space:]]+|[[:space:]]+$/, "", name)
            if (name == key) {
                print substr(line, equals + 1)
                found = 1
                exit
            }
        }
        END { if (!found) exit 1 }
    ' "$file")"; then
        return 1
    fi

    if [[ "$value" == \"*\" && ${#value} -ge 2 ]]; then
        value="${value:1:${#value}-2}"
    elif [[ "$value" == \'*\' && ${#value} -ge 2 ]]; then
        value="${value:1:${#value}-2}"
    fi
    ENV_VALUE="$value"
}

check_template_keys() {
    local example="$1"
    local env_file="$2"
    local key
    local failed=0

    while IFS= read -r key; do
        if ! read_env_value "$env_file" "$key"; then
            printf 'Missing key %s in %s (required by %s)\n' \
                "$key" "${env_file#"$root_dir"/}" "${example#"$root_dir"/}" >&2
            failed=1
        fi
    done < <(awk '
        {
            line = $0
            sub(/\r$/, "", line)
            sub(/^[[:space:]]*/, "", line)
            sub(/^#[[:space:]]*/, "", line)
            equals = index(line, "=")
            if (!equals) next
            key = substr(line, 1, equals - 1)
            gsub(/^[[:space:]]+|[[:space:]]+$/, "", key)
            if (key ~ /^[A-Za-z_][A-Za-z0-9_]*$/ && !seen[key]++) print key
        }
    ' "$example")

    return "$failed"
}

failed=0
for key in DB_DATABASE DB_USERNAME DB_PASSWORD; do
    if ! read_env_value "$root_env" "$key"; then
        printf 'Missing key %s in .env\n' "$key" >&2
        failed=1
        continue
    fi
    root_value="$ENV_VALUE"

    if ! read_env_value "$backend_env" "$key"; then
        printf 'Missing key %s in backend/.env\n' "$key" >&2
        failed=1
        continue
    fi
    if [[ "$root_value" != "$ENV_VALUE" ]]; then
        printf 'Mismatch for %s between .env and backend/.env\n' "$key" >&2
        failed=1
    fi
done

check_template_keys "$root_example" "$root_env" || failed=1
check_template_keys "$backend_example" "$backend_env" || failed=1

if (( failed )); then
    exit 1
fi

printf 'OK: shared database values match and all template keys exist.\n'
