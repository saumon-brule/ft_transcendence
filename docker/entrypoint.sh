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

# Public address of the site from its host and port; the port is left out when it is 443, as in the address registered at 42
if [ -z "${BASE_FRONT_URL:-}" ] && [ -n "${FRONT_HOST:-}" ]; then
	if [ "${FRONT_PORT:-443}" = 443 ]; then
		export BASE_FRONT_URL="https://${FRONT_HOST}"
	else
		export BASE_FRONT_URL="https://${FRONT_HOST}:${FRONT_PORT}"
	fi
fi

if [ -z "${DATABASE_URL:-}" ] && [ -n "${POSTGRES_PASSWORD:-}" ]; then
	password=$(node -p 'encodeURIComponent(process.env.POSTGRES_PASSWORD)')
	export DATABASE_URL="postgresql://${POSTGRES_USER}:${password}@${POSTGRES_HOST:-postgres}:5432/${POSTGRES_DB}"
fi

exec "$@"
