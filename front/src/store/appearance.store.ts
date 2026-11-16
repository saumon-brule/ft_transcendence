import { createEffect, createSignal } from "solid-js";
import { createStore } from "solid-js/store";
import { LocalStorageItem } from "~/utils/storageHelper";

type AppearanceStore = {
	theme: "light" | "dark";
	useDevice: boolean;
};

const appearanceItem = new LocalStorageItem<AppearanceStore>("appearance", () => ({
	theme: "dark",
	useDevice: true,
}));

const [appearanceStore, setAppearanceStore] = createStore<AppearanceStore>(appearanceItem.get());


function changeTheme(theme: AppearanceStore["theme"]) {
	setAppearanceStore("theme", theme);
}

function changeUseDevice(useDevice: AppearanceStore["useDevice"]) {
	setAppearanceStore("useDevice", useDevice);
}

const media = window.matchMedia("(prefers-color-scheme: dark)");
export const [systemDark, setSystemDark] = createSignal(media.matches);
media.addEventListener("change", (e) => setSystemDark(e.matches));

createEffect(() => {
	if (appearanceStore.useDevice) {
		document.documentElement.dataset.theme = "auto";
	} else {
		document.documentElement.dataset.theme = appearanceStore.theme;
	}
});

export { appearanceStore, changeTheme, changeUseDevice };
