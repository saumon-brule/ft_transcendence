import { Show, type JSX } from "solid-js";
import type { OnlineStatus } from "@flex/shared";
import { presenceOf } from "~/store/presence.store";
import "./PresenceDot.scss";
import { useTranslation } from "~/i18n/context";

export function PresenceDot(props: { uuid: string; status?: OnlineStatus }) {
	const { t } = useTranslation();
	return <Show when={presenceOf(props.uuid, props.status) !== undefined}>
		<span
			class="presence-dot"
			classList={{ online: presenceOf(props.uuid, props.status) === true }}
			role="img"
			aria-label={presenceOf(props.uuid, props.status)
				? t("common.online")
				: t("common.offline")}
		/>
	</Show>;
}

export function PresenceAvatar(props: { uuid: string; status?: OnlineStatus; children: JSX.Element }) {
	return <span class="presence-avatar">
		{props.children}
		<PresenceDot uuid={props.uuid} status={props.status} />
	</span>;
}
