import Button from "~/components/inputs/Button";
import { summonPopUp } from "~/components/ui/Overlay";

export const summonProviderKeyPopUp = (key: string, onClose?: () => void) => summonPopUp((popUpControls) => {
	return <div>
		<h2>Your provider key</h2>
		<p>Copy this key to authentificate your provider. You can only see this key once.</p>
		<code>{key}</code>
		<div class="pop-up-buttons">
			<Button type="button" onClick={popUpControls.close} variant="text" size="md">Close</Button>
		</div>
	</div>;
}, { customClass: "provider-pop-up", onClose });
