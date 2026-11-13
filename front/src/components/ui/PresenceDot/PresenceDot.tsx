import { Show, type JSX } from "solid-js";
import { presenceOf } from "~/store/presence.store";
import "./PresenceDot.scss";

export function PresenceDot(props: { uuid: string }) {
	return <Show when={presenceOf(props.uuid) !== undefined}>
		<span
			class="presence-dot"
			classList={{ online: presenceOf(props.uuid) === true }}
			role="img"
			aria-label={presenceOf(props.uuid)
				? "Online"
				: "Offline"}
		/>
	</Show>;
}

export function PresenceAvatar(props: { uuid: string; children: JSX.Element }) {
	return <span class="presence-avatar">
		{props.children}
		<PresenceDot uuid={props.uuid} />
	</span>;
}
