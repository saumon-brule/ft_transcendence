/* @refresh reload */
import { render } from "solid-js/web";
import "solid-devtools";

import "./index.scss";

import App from "./App";
import { devWarn } from "./utils/devLog";

window.addEventListener("error", (event) => {
	event.preventDefault();
	devWarn("Uncaught error:", event.error ?? event.message);
});
window.addEventListener("unhandledrejection", (event) => {
	event.preventDefault();
	devWarn("Unhandled promise rejection:", event.reason);
});

const root = document.getElementById("root");

if (import.meta.env.DEV && !(root instanceof HTMLElement)) {
	throw new Error(
		"Root element not found. Did you forget to add it to your index.html? Or maybe the id attribute got misspelled?",
	);
}

render(() => <App />, root!);
