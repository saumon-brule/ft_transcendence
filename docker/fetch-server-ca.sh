#!/bin/sh
# Fills secrets/provider-<name>/server_ca.crt with the certificate presented by FLEX_SERVER_URL,
# only when the file is empty or missing (trust on first use). Skipped for http:// URLs.
set -eu

root=$(cd "$(dirname "$0")/.." && pwd)
name=${1:?usage: $0 <provider name>}
env_file="$root/.env.provider-$name"
target="$root/secrets/provider-$name/server_ca.crt"

[ -s "$target" ] && exit 0

url=$(sed -n 's/^FLEX_SERVER_URL=//p' "$env_file" | tail -n 1 | tr -d '"'"'"' \r')
case "$url" in
	https://*) ;;
	*) exit 0 ;;
esac

hostport=${url#https://}
hostport=${hostport%%/*}
host=${hostport%%:*}
port=443
case "$hostport" in *:*) port=${hostport##*:} ;; esac

tmp=$(mktemp)
trap 'rm -f "$tmp"' EXIT
if ! openssl s_client -connect "$host:$port" -servername "$host" </dev/null 2>/dev/null | openssl x509 > "$tmp" 2>/dev/null || [ ! -s "$tmp" ]; then
	echo "cannot fetch the certificate of $host:$port (FLEX_SERVER_URL=$url)" >&2
	exit 1
fi
cat "$tmp" > "$target"
chmod 644 "$target"
echo "fetched  server_ca.crt from $host:$port"
