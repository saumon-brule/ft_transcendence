import { createSignal, onCleanup } from "solid-js";
import { io, type Socket } from "socket.io-client";
import type { ClientToServerEvents, ServerToClientEvents } from "@flex/shared";
import { env } from "~/env";
import { auth, authActions } from "~/store/auth.store";
import { doRefresh } from "./doRefresh";

const RECONNECT_BASE_DELAY_MS = 1_000;
const RECONNECT_MAX_DELAY_MS = 30_000;
const TOKEN_REFRESH_COOLDOWN_MS = 30_000;

const apiUrl = new URL(env.VITE_API_URL, window.location.href);

export type AppSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

export function createSocket() {
	const socket: AppSocket = io(apiUrl.origin, {
		path: `${apiUrl.pathname.replace(/\/$/, "")}/socket.io`,
		autoConnect: false,
		transports: ["websocket"],
		auth: (callback) => { callback({ token: auth.accessToken }); },
	});

	const [socketConnected, setSocketConnected] = createSignal(false);

	let reconnectTimer: ReturnType<typeof setTimeout> | undefined;
	let reconnectAttempt = 0;
	let refreshingToken = false;
	let lastTokenRefresh = 0;
	let disposed = false;

	function scheduleReconnect() {
		if (disposed) return;
		clearTimeout(reconnectTimer);
		const delay = Math.min(RECONNECT_BASE_DELAY_MS * 2 ** reconnectAttempt, RECONNECT_MAX_DELAY_MS);
		reconnectAttempt++;
		reconnectTimer = setTimeout(() => {
			socket.connect();
		}, delay);
	}

	async function renewToken() {
		if (refreshingToken || Date.now() - lastTokenRefresh < TOKEN_REFRESH_COOLDOWN_MS) return;

		refreshingToken = true;
		try {
			const accessToken = await doRefresh();
			if (disposed) return;
			lastTokenRefresh = Date.now();
			if (accessToken === null) {
				authActions.logout();
				return;
			}
			authActions.login(accessToken);
			socket.connect();
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

	socket.connect();

	onCleanup(() => {
		disposed = true;
		clearTimeout(reconnectTimer);
		socket.disconnect();
	});

	return { socket, socketConnected };
}
