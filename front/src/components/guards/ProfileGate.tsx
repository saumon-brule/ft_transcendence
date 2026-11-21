import { Accessor, createContext, createEffect, JSXElement, Match, Switch, useContext } from "solid-js";
import Button from "~/components/inputs/Button";
import DialogPage from "~/components/ui/DialogPage";
import { MeProfile, useMeProfileQuery } from "~/api/queryHooks/meProfile";
import { useTranslation } from "~/i18n/context";
import LoadingSplash from "~/pages/Loading/LoadingSplash";
import { createSocket } from "~/api/socket";
import { SocketContext } from "~/api/socket.context";
import { useChatEvents } from "~/api/socketHooks/useChatEvents";
import { usePresenceEvents } from "~/api/socketHooks/usePresenceEvents";
import { useFriendEvents } from "~/api/socketHooks/useFriendEvents";
import { useTokenRefresh } from "~/api/socketHooks/useTokenRefresh";
import { useReconnectSync } from "~/api/socketHooks/useReconnectSync";

const ProfileContext = createContext<Accessor<MeProfile>>();

export function useProfile() {
	const ctx = useContext(ProfileContext);
	if (!ctx) throw new Error("useProfile should only be used with ProfileGate parent.");
	return ctx;
}

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
	useFriendEvents(socket);
	useReconnectSync(socket);
	useTokenRefresh(socket);

	return <Switch fallback={<LoadingSplash />}>
		<Match when={profile.data}>{(data) => (
			<ProfileContext.Provider value={() => data().body}>
				<SocketContext.Provider value={{ socket, socketConnected }}>
					{props.children}
				</SocketContext.Provider>
			</ProfileContext.Provider>
		)}
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
