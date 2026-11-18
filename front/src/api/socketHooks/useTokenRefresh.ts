import { createEffect, onCleanup } from "solid-js";
import { jwtDecode } from "jwt-decode";
import { doRefresh } from "~/api/doRefresh";
import type { AppSocket } from "~/api/socket";
import { auth, authActions } from "~/store/auth.store";

const REFRESH_MARGIN_MS = 60_000;
const MIN_REFRESH_DELAY_MS = 10_000;
const RETRY_DELAY_MS = 30_000;

export function useTokenRefresh(socket: AppSocket) {
	let timer: ReturnType<typeof setTimeout> | undefined;

	async function renew() {
		try {
			const accessToken = await doRefresh();
			if (accessToken === null) {
				authActions.logout();
				return;
			}
			authActions.login(accessToken);
		} catch {
			timer = setTimeout(() => void renew(), RETRY_DELAY_MS);
		}
	}

	createEffect(() => {
		const token = auth.accessToken;
		clearTimeout(timer);
		if (token === null) return;

		if (socket.connected) socket.emit("auth:refresh", { token });

		const { exp } = jwtDecode<{ exp?: number }>(token);
		if (exp === undefined) return;

		const delay = Math.max(exp * 1000 - Date.now() - REFRESH_MARGIN_MS, MIN_REFRESH_DELAY_MS);
		timer = setTimeout(() => void renew(), delay);
	});

	onCleanup(() => clearTimeout(timer));
}
