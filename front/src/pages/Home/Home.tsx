import { useNavigate } from "@solidjs/router";
import { Show } from "solid-js";
import { client, queryKeys } from "~/api/client";
import { useAudioPlayerContext } from "~/components/context/AudioManagerContext";
import Button from "~/components/ui/Button";
import { authActions } from "~/store/auth.store";

export default function Home() {
	const profile = client.members.profile.createQuery(queryKeys.members.profile, () => ({}));

	const navigate = useNavigate();

	const audioManager = useAudioPlayerContext();

	function logout() {
		authActions.logout();
	}

	return <div style={{ background: "red" }}>
		HOME, SWEET HOME ...
		<Show when={profile.isFetched}>
			<pre><code>{JSON.stringify(profile.data?.body, null, 2)}</code></pre>
			<Button onClick={logout}>logout</Button>
			<Button onClick={() => navigate("/")}>Landing</Button>
			{audioManager.currentMusic()?.path ?? ""}
			<div style={{ display: "flex" }}>
				<Button onClick={audioManager.back}>Back</Button>
				<Button onClick={audioManager.toggle}>{audioManager.playing() ? "Pause" : "Play"}</Button>
				<Button onClick={audioManager.forward}>Forward</Button>
			</div>
			{audioManager.progression()}/{audioManager.duration()}
		</Show>
	</div>;
}
