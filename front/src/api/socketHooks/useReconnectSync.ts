import { queryClient } from "~/api/queryClient";
import type { AppSocket } from "~/api/socket";

export function useReconnectSync(socket: AppSocket) {
	let hasConnected = socket.connected;

	socket.on("connect", () => {
		if (hasConnected) void queryClient.invalidateQueries();
		hasConnected = true;
	});
}
