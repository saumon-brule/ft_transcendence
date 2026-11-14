#!/bin/sh
set -eu

root=$(cd "$(dirname "$0")/.." && pwd)
todo=""

case "${1:-}" in
	server) dir="$root/secrets" ;;
	provider) dir="$root/provider/secrets${2:+.$2}" ;;
	*) echo "usage: $0 server|provider [instance]" >&2; exit 1 ;;
esac

mkdir -p "$dir"
chmod 700 "$dir"

create() {
	name=$1; shift
	if [ -e "$dir/$name" ]; then
		echo "exists   $name"
		return
	fi
	"$@" "$dir/$name"
	chmod 644 "$dir/$name"
	echo "created  $name"
}

random() { openssl rand -hex 32 | tr -d '\n' > "$1"; }
empty() { : > "$1"; todo="$todo $(basename "$1")"; }
rsa_key() { openssl genrsa -out "$1" 2048 2>/dev/null; }

certificate() {
	names="DNS:localhost,DNS:host.docker.internal,IP:127.0.0.1"
	[ -z "${DOMAIN:-}" ] || names="$names,DNS:$DOMAIN"
	openssl req -x509 -newkey rsa:2048 -nodes -days 365 -subj "/CN=${DOMAIN:-localhost}" \
		-addext "subjectAltName=$names" -keyout "$dir/tls.key" -out "$dir/tls.crt" 2>/dev/null
}
create_certificate() {
	if [ -e "$dir/tls.crt" ] || [ -e "$dir/tls.key" ]; then
		echo "exists   tls.crt, tls.key"
		return
	fi
	certificate
	chmod 644 "$dir/tls.crt" "$dir/tls.key"
	echo "created  tls.crt, tls.key (self-signed)"
}

create postgres_password random
create_certificate

if [ "$1" = server ]; then
	create jwt_secret random
	create jwt_refresh_secret random
	create provider.pem rsa_key
	create smtp_pass empty
	create api42_client_secret empty
else
	create flex_api_key empty
	if [ -e "$root/secrets/tls.crt" ]; then
		create server_ca.crt cp "$root/secrets/tls.crt"
	else
		create server_ca.crt empty
	fi
fi

if [ -n "$todo" ]; then
	echo
	echo "To fill in by hand in $dir:$todo"
fi
