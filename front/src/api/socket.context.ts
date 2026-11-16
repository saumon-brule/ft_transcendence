import { createContext, useContext } from "solid-js";
import type { createSocket } from "./socket";

export const SocketContext = createContext<ReturnType<typeof createSocket>>();

export function useSocketContext() {
	const ctx = useContext(SocketContext);
	if (!ctx) throw new Error("useSocketContext must be used under <ProfileGate>.");
	return ctx;
}
