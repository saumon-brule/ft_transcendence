import { createSignal } from "solid-js";

const [isSidebarOpen, setIsSidebarOpen] = createSignal(false);

export const sidebarActions = {
	toggle: () => setIsSidebarOpen((open) => !open),
	close: () => setIsSidebarOpen(false),
};

export { isSidebarOpen };
