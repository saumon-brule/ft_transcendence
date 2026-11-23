#!/bin/sh
set -eu

root=$(cd "$(dirname "$0")/.." && pwd)
todo=""

case "${1:-}" in
	server)
		dir="$root/secrets/server"
		env_file="$root/.env"
		env_example="$root/.env.example"
		host_var=FRONT_HOST
		;;
	provider)
		instance=${2:-}
		case "$instance" in
			""|-*|*[!a-z0-9-]*) echo "usage: $0 provider <name> (lowercase letters, digits and dashes)" >&2; exit 1 ;;
		esac
		dir="$root/secrets/provider-$instance"
		env_file="$root/.env.provider-$instance"
		env_example="$root/.env.provider.example"
		host_var=PROVIDER_HOST
		;;
	*) echo "usage: $0 server | provider <name>" >&2; exit 1 ;;
esac

mkdir -p "$dir"
chmod 700 "$dir"

create() {
	name=$1; shift
	[ -d "$dir/$name" ] && rmdir "$dir/$name" 2>/dev/null || true
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

# Public host of this stack, read from its env file (FRONT_HOST for the server, PROVIDER_HOST for a provider).
public_host() {
	[ -f "$env_file" ] || return 0
	sed -n "s/^$host_var=//p" "$env_file" | tail -n 1 | tr -d '"\r '
}

# SAN entry: IP:<ip> for an address, DNS:<name> otherwise.
san_entry() {
	case "$1" in
		*:*) echo "IP:$1" ;;
		*[!0-9.]*) echo "DNS:$1" ;;
		*) echo "IP:$1" ;;
	esac
}

certificate() {
	host=$(public_host)
	[ -n "$host" ] || host=${DOMAIN:-localhost}
	names="DNS:localhost,DNS:host.docker.internal,IP:127.0.0.1"
	case "$host" in localhost|127.0.0.1|host.docker.internal) ;; *) names="$names,$(san_entry "$host")" ;; esac
	[ -z "${DOMAIN:-}" ] || [ "$DOMAIN" = "$host" ] || names="$names,$(san_entry "$DOMAIN")"
	openssl req -x509 -newkey rsa:2048 -nodes -days 365 -subj "/CN=$host" \
		-addext "subjectAltName=$names" -keyout "$dir/tls.key" -out "$dir/tls.crt" 2>/dev/null
	echo "         certificate names: $names"
}
create_certificate() {
	# Docker creates an empty directory when a bind-mounted secret file is missing: clean those up.
	for f in tls.crt tls.key; do
		[ -d "$dir/$f" ] && rmdir "$dir/$f" 2>/dev/null || true
	done
	if [ -f "$dir/tls.crt" ] && [ -f "$dir/tls.key" ]; then
		echo "exists   tls.crt, tls.key"
		host=$(public_host)
		if [ -n "$host" ] && [ -s "$dir/tls.crt" ] && ! openssl x509 -in "$dir/tls.crt" -noout -ext subjectAltName 2>/dev/null | grep -qF "$host"; then
			echo "warning  tls.crt does not cover $host ($host_var): delete tls.crt and tls.key, then run this again" >&2
		fi
		return
	fi
	rm -f "$dir/tls.crt" "$dir/tls.key"
	certificate
	chmod 644 "$dir/tls.crt" "$dir/tls.key"
	echo "created  tls.crt, tls.key (self-signed)"
}

# The env file comes first: the certificate reads the public host from it.
if [ ! -e "$env_file" ]; then
	cp "$env_example" "$env_file"
	echo "created  $(basename "$env_file") (from $(basename "$env_example"))"
	echo "         $host_var is read from it for the certificate: to use another host than localhost,"
	echo "         edit the file, delete tls.crt and tls.key from $dir, then run this again"
fi

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

if [ -n "$todo" ]; then
	echo
	echo "To fill in by hand in $dir:$todo"
fi
