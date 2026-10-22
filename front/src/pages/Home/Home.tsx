import { useNavigate } from "@solidjs/router";
import { Show } from "solid-js";
import { client, queryKeys } from "~/api/client";
import Button from "~/components/inputs/Button";
import { summonPopUp } from "~/components/ui/Overlay";
import { authActions } from "~/store/auth.store";

function RecursivePopUp(props: { recursionCount?: number }) {
	return <>Recusrive foutre {props.recursionCount ?? 0}<br/><Button onClick={() => summonPopUp(<RecursivePopUp recursionCount={(props.recursionCount ?? 0) + 1}/>)}>PopUp</Button></>;
}

export default function Home() {
	const me = client.users.me.createQuery(queryKeys.users.me, () => ({}));

	const navigate = useNavigate();

	function logout() {
		authActions.logout();
	}

	return <div style={{ background: "red" }}>
		HOME, SWEET HOME ...
		<Show when={me.isFetched}>
			<pre><code>{JSON.stringify(me.data?.body, null, 2)}</code></pre>
			<Button onClick={logout}>logout</Button>
			<Button onClick={() => navigate("/")}>Landing</Button>
			<Button onClick={() => summonPopUp(<RecursivePopUp/>)}>PopUp</Button>
		</Show>
	</div>;
}
