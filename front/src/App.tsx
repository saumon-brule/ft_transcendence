import { AppRouter } from "./routes";
import { Component } from "solid-js";

import "./store/presence.store";
import "./store/messages.store";

const App: Component = () => {
	return <AppRouter />;
};

export default App;
