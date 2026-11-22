import { createSignal, onCleanup, Show } from "solid-js";
import { Check, Copy } from "lucide-solid";
import Button from "~/components/inputs/Button";
import { summonPopUp } from "~/components/ui/Overlay";
import { summonErrorToast } from "~/components/ui/Toaster";
import { t } from "~/i18n/context";

const COPIED_FEEDBACK_MS = 2_000;

export const summonProviderKeyPopUp = (key: string, onClose?: () => void) => summonPopUp((popUpControls) => {
	const [copied, setCopied] = createSignal(false);
	let resetTimer: ReturnType<typeof setTimeout> | undefined;

	onCleanup(() => clearTimeout(resetTimer));

	async function copyKey() {
		try {
			await navigator.clipboard.writeText(key);
			setCopied(true);
			clearTimeout(resetTimer);
			resetTimer = setTimeout(() => setCopied(false), COPIED_FEEDBACK_MS);
		} catch {
			summonErrorToast(() => t("components.keyPopUp.copyError"));
		}
	}

	return <div class="provider-pop-up-container">
		<h2>{t("pages.providers.keyPopUp.title")}</h2>
		<div class="pop-up-inputs">
			<p>{t("pages.providers.keyPopUp.description")}</p>
			<div
				class="provider-key-copy"
				role="button"
				tabindex="0"
				title={t("components.keyPopUp.copyTitle")}
				onClick={() => void copyKey()}
				onKeyDown={(e) => {
					if (e.key === "Enter" || e.key === " ") {
						e.preventDefault();
						void copyKey();
					}
				}}
			>
				<code>{key}</code>
				<span class="provider-key-copy-icon">
					<Show when={copied()} fallback={<Copy size={18} />}><Check size={18} /></Show>
				</span>
			</div>
			<span class="provider-key-copy-status" aria-live="polite">{copied() ? t("components.keyPopUp.copied") : t("components.keyPopUp.clickToCopy")}</span>
		</div>
		<div class="pop-up-buttons">
			<Button type="button" onClick={popUpControls.close} variant="text" size="md">{t("common.close")}</Button>
		</div>
	</div>;
}, { customClass: "provider-pop-up", onClose });
