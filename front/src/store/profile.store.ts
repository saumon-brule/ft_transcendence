import { createStore, reconcile } from "solid-js/store";
import { client, queryKeys } from "~/api/client";
import { Profile } from "@flex/shared";

interface ProfileState {
	profile: Profile | null;
	initialized: boolean;
}

export function createProfileStore() {
	const [state, setState] = createStore<ProfileState>({
		profile: null,
		initialized: false,
	});

	const actions = {
		async init() {
			try {
				const query = client.users.me.createQuery(queryKeys.users.me, () => ({}));
				const res = await query.refetch();
				setState("profile", res.data?.body ?? null);
			} catch {
				setState("profile", null);
			} finally {
				setState("initialized", true);
			}
		},
		set(profile: Profile | null) {
			setState("profile", reconcile(profile));
		},
		update(patch: Partial<Profile>) {
			setState("profile", (p) => (p ? { ...p, ...patch } : p));
		},
		clear() {
			setState("profile", null);
		},
	};

	return [state, actions] as const;
}

export type ProfileStore = ReturnType<typeof createProfileStore>;
