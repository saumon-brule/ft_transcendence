import { Show } from "solid-js";
import { client, queryKeys } from "~/api/client";
import Button from "~/components/ui/Button";
import { authActions } from "~/store/auth.store";

export default function Home() {
	const me = client.users.me.createQuery(queryKeys.users.me, () => ({}));


	function logout() {
		authActions.logout();
	}

	return <div style={{ background: "red" }}>
		HOME, SWEET HOME ...
		<Show when={me.isFetched}>
			<pre><code>{JSON.stringify(me.data?.body, null, 2)}</code></pre>
			<Button onClick={logout}>logout</Button>
		</Show>
	</div>;
}
