#!/bin/sh
set -eu

for file_var in $(env | sed -n 's/^\([A-Za-z0-9_]*_FILE\)=.*/\1/p'); do
	name=${file_var%_FILE}
	eval "path=\${$file_var}"
	if [ ! -r "$path" ]; then
		echo "entrypoint: $file_var points to an unreadable file ($path)" >&2
		exit 1
	fi
	export "$name=$(cat "$path")"
done

if [ -z "${DATABASE_URL:-}" ] && [ -n "${POSTGRES_PASSWORD:-}" ]; then
	password=$(node -p 'encodeURIComponent(process.env.POSTGRES_PASSWORD)')
	export DATABASE_URL="postgresql://${POSTGRES_USER}:${password}@${POSTGRES_HOST:-postgres}:5432/${POSTGRES_DB}"
fi

exec "$@"
