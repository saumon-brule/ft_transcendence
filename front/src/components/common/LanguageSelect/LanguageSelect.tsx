import { For, Show } from "solid-js";
import Select from "~/components/inputs/Select/Select";
import { type Locale, localeSchema, useTranslation } from "~/i18n/context";
import { isLoggedIn } from "~/store/auth.store";

import "./LanguageSelect.scss";

const LANGUAGE_LABEL_KEYS = {
	en: "pages.settings.account.language.english",
	fr: "pages.settings.account.language.french",
} as const satisfies Record<Locale, string>;

/** Language picker for logged-out pages. Logged-in users change it from their account settings. */
export default function LanguageSelect(props: { class?: string }) {
	const { t, locale, setLocale } = useTranslation();

	return <Show when={!isLoggedIn()}>
		<Select
			class={`language-select ${props.class ?? ""}`}
			aria-label={t("components.languageSelect.label")}
			onChange={(e) => {
				const parsed = localeSchema.safeParse(e.currentTarget.value);
				if (parsed.success) setLocale(parsed.data);
			}}
		>
			<For each={localeSchema.options}>
				{(lang) => <option value={lang} selected={locale() === lang}>{t(LANGUAGE_LABEL_KEYS[lang])}</option>}
			</For>
		</Select>
	</Show>;
}
