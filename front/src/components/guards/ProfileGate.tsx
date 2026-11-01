import { createEffect, JSXElement, Show } from "solid-js";
import { useMeProfileQuery } from "~/api/queryHooks/meProfile";
import { useTranslation } from "~/i18n/context";
import LoadingSplash from "~/pages/Loading/LoadingSplash";

export default function ProfileGate(props: { children: JSXElement }) {
	const profile = useMeProfileQuery();

	const { locale, setLocale } = useTranslation();

	createEffect(() => {
		const language = profile.data?.body.language;
		if (language && language !== locale()) {
			setLocale(language);
		}
	});

	return <Show when={profile.data} fallback={<LoadingSplash/>}>
		{props.children}
	</Show>;
}
