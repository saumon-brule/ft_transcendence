import { createEffect, JSXElement, Show } from "solid-js";
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

	const { locale, setLocale } = useTranslation();

	createEffect(() => {
		const language = profile.data?.body.language;
		if (language && language !== locale()) {
			setLocale(language);
		}
	});

	useChatEvents(socket);
	usePresenceEvents(socket);

	return <Show when={profile.data} fallback={<LoadingSplash />}>
		<SocketContext.Provider value={{ socket, socketConnected }}>
			{props.children}
		</SocketContext.Provider>
	</Show>;
}
