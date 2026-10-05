import { useParams } from "@solidjs/router";
import { createEffect, Show } from "solid-js";
import { client, queryKeys } from "~/api/client";
import { summonErrorToast } from "~/components/ui/Toaster";
import { useProfile } from "~/components/context/ProfileContext";

import "./Settings.scss";
import TextInput from "~/components/ui/TextInput";
import Form from "~/components/ui/Form/Form";

export default function Settings() {
	const [me, { update }] = useProfile();

	

	return <div class="page" id="settings">
		<h1>Settings</h1>
		<Show when={me.profile}>
			{(user) => <div class="settings-content">
				<h2>Profile {user().username}</h2>
				<Form>
					<TextInput
						value={user().username}
						onInput={(e) => update({ username: e.currentTarget.value })}
					/>
				</Form>
			</div>}
		</Show>
	</div>;
}
