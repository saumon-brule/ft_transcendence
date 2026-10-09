import { createContext, useContext, onMount, type ParentComponent } from "solid-js";
import { createProfileStore, type ProfileStore } from "~/store/profile.store";

const ProfileContext = createContext<ProfileStore>();

export const ProfileProvider: ParentComponent = (props) => {
	const store = createProfileStore();

	onMount(() => void store[1].init());

	return (
		<ProfileContext.Provider value={store}>
			{props.children}
		</ProfileContext.Provider>
	);
};

export function useProfile() {
	const ctx = useContext(ProfileContext);
	if (!ctx) throw new Error("useProfile must be used within a ProfileProvider");
	return ctx;
}
