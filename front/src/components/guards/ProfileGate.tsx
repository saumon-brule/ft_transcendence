import { createEffect, JSXElement, Match, Switch } from "solid-js";
import Button from "~/components/inputs/Button";
import DialogPage from "~/components/ui/DialogPage";
import { useMeProfileQuery } from "~/api/queryHooks/meProfile";
import { useTranslation } from "~/i18n/context";
import LoadingSplash from "~/pages/Loading/LoadingSplash";
import { createSocket } from "~/api/socket";
import { SocketContext } from "~/api/socket.context";
import { useChatEvents } from "~/api/socketHooks/useChatEvents";
import { usePresenceEvents } from "~/api/socketHooks/usePresenceEvents";

export default function ProfileGate(props: { children: JSXElement }) {
	const profile = useMeProfileQuery();
	const { socket, socketConnected } = createSocket();

	const { t, locale, setLocale } = useTranslation();

	createEffect(() => {
		const language = profile.data?.body.language;
		if (language && language !== locale()) {
			setLocale(language);
		}
	});

	useChatEvents(socket);
	usePresenceEvents(socket);

	return <Switch fallback={<LoadingSplash />}>
		<Match when={profile.data}>
			<SocketContext.Provider value={{ socket, socketConnected }}>
				{props.children}
			</SocketContext.Provider>
		</Match>
		<Match when={profile.isError}>
			<DialogPage>
				<h2>{t("errors.profileUnavailable")}</h2>
				<p>{t("errors.unknownFallback")}</p>
				<Button disabled={profile.isFetching} onClick={() => void profile.refetch()}>{t("errors.retry")}</Button>
			</DialogPage>
		</Match>
	</Switch>;
}
