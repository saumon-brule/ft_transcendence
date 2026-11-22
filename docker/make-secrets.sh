#!/bin/sh
set -eu

root=$(cd "$(dirname "$0")/.." && pwd)
todo=""

case "${1:-}" in
	server)
		dir="$root/secrets/server"
		env_file="$root/.env"
		env_example="$root/.env.example"
		;;
	provider)
		instance=${2:-}
		case "$instance" in
			""|-*|*[!a-z0-9-]*) echo "usage: $0 provider <name> (lowercase letters, digits and dashes)" >&2; exit 1 ;;
		esac
		dir="$root/secrets/provider-$instance"
		env_file="$root/.env.provider-$instance"
		env_example="$root/.env.provider.example"
		;;
	*) echo "usage: $0 server | provider <name>" >&2; exit 1 ;;
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
	if [ -e "$root/secrets/server/tls.crt" ]; then
		create server_ca.crt cp "$root/secrets/server/tls.crt"
	else
		create server_ca.crt empty
	fi
fi

if [ ! -e "$env_file" ]; then
	cp "$env_example" "$env_file"
	echo "created  $(basename "$env_file") (from $(basename "$env_example"), fill it in)"
fi

if [ -n "$todo" ]; then
	echo
	echo "To fill in by hand in $dir:$todo"
fi
