import { createEffect, createMemo, createRoot, createSignal } from "solid-js";
import { io, type Socket } from "socket.io-client";
import type { ServerToClientEvents } from "@flex/shared";
import { env } from "~/env";
import { auth, authActions } from "~/store/auth.store";
import { doRefresh } from "./doRefresh";

const RECONNECT_BASE_DELAY_MS = 1_000;
const RECONNECT_MAX_DELAY_MS = 30_000;
const TOKEN_REFRESH_COOLDOWN_MS = 30_000;

const apiUrl = new URL(env.VITE_API_URL, window.location.href);

export const socket: Socket<ServerToClientEvents> = io(apiUrl.origin, {
	path: `${apiUrl.pathname.replace(/\/$/, "")}/socket.io`,
	autoConnect: false,
	transports: ["websocket"],
	auth: (callback) => { callback({ token: auth.accessToken }); },
});

const [socketConnected, setSocketConnected] = createSignal(false);
export { socketConnected };

const connectable = createRoot(() => {
	const canConnect = createMemo(() => auth.accessToken !== null && auth.jwtPayload.emailVerified);
	return canConnect;
});

let reconnectTimer: ReturnType<typeof setTimeout> | undefined;
let reconnectAttempt = 0;
let refreshingToken = false;
let lastTokenRefresh = 0;

function scheduleReconnect() {
	clearTimeout(reconnectTimer);
	const delay = Math.min(RECONNECT_BASE_DELAY_MS * 2 ** reconnectAttempt, RECONNECT_MAX_DELAY_MS);
	reconnectAttempt++;
	reconnectTimer = setTimeout(() => {
		if (connectable()) socket.connect();
	}, delay);
}

async function renewToken() {
	if (refreshingToken || Date.now() - lastTokenRefresh < TOKEN_REFRESH_COOLDOWN_MS) return;

	refreshingToken = true;
	try {
		const accessToken = await doRefresh();
		lastTokenRefresh = Date.now();
		if (accessToken === null) {
			authActions.logout();
			return;
		}

		authActions.login(accessToken);
		if (connectable()) socket.connect();
	} finally {
		refreshingToken = false;
	}
}

socket.on("connect", () => {
	reconnectAttempt = 0;
	setSocketConnected(true);
});

socket.on("disconnect", (reason) => {
	setSocketConnected(false);
	if (reason === "io server disconnect") scheduleReconnect();
});

socket.on("connect_error", (error) => {
	if (error.message === "Unauthorized") void renewToken();
});

createRoot(() => {
	createEffect(() => {
		if (connectable()) {
			socket.connect();
		} else {
			clearTimeout(reconnectTimer);
			socket.disconnect();
		}
	});
});
