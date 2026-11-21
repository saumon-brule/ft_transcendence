import { createSignal, onCleanup, Show } from "solid-js";
import { Check, Copy } from "lucide-solid";
import Button from "~/components/inputs/Button";
import { summonPopUp } from "~/components/ui/Overlay";
import { summonErrorToast } from "~/components/ui/Toaster";

const COPIED_FEEDBACK_MS = 2_000;

export const summonPublicKeyPopUp = (key: string, onClose?: () => void) => summonPopUp((popUpControls) => {
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
			summonErrorToast(() => "Failed to copy the key, please copy it manually");
		}
	}

	return <div class="provider-pop-up-container">
		<h2>Your public key</h2>
		<div class="pop-up-inputs">
			<p>You can only see this key once.</p>
			<div
				class="provider-key-copy"
				role="button"
				tabindex="0"
				title="Copy to clipboard"
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
			<span class="provider-key-copy-status" aria-live="polite">{copied() ? "Copied to clipboard" : "Click the key to copy it"}</span>
		</div>
		<div class="pop-up-buttons">
			<Button type="button" onClick={popUpControls.close} variant="text" size="md">Close</Button>
		</div>
	</div>;
}, { customClass: "provider-pop-up", onClose });
