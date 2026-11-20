import { createProviderRoleSchema, Provider, ProviderPermission, providerPermissions } from "@flex/shared";
import { createSignal, For } from "solid-js";
import { providerCreateRole } from "~/api/queryHooks/providerManageRoles";
import Button from "~/components/inputs/Button";
import Checkbox from "~/components/inputs/Checkbox/Checkbox";
import Form from "~/components/inputs/Form/Form";
import TextInput from "~/components/inputs/TextInput";
import { summonPopUp } from "~/components/ui/Overlay";
import { summonSuccessToast } from "~/components/ui/Toaster";
import { validateFromZod } from "~/utils/validateFromZod";

export const summonAddRolePopUp = (provider: Provider, onClose?: () => void) => summonPopUp((popUpControls) => {
	const [permissions, setPermissions] = createSignal<Array<ProviderPermission>>([]);
	const [isPending, setIsPending] = createSignal(false);

	let nameInput!: HTMLInputElement;

	function togglePermission(permission: ProviderPermission, checked: boolean) {
		setPermissions((prev) => checked ? [...prev, permission] : prev.filter((p) => p !== permission));
	}

	async function handleSubmit(e: SubmitEvent) {
		e.preventDefault();
		setIsPending(true);
		const success = await providerCreateRole(provider, nameInput.value.trim(), permissions());
		setIsPending(false);
		if (success) {
			summonSuccessToast("Role created");
			popUpControls.close();
		}
	}

	return <Form onSubmit={(e) => void handleSubmit(e)}>
		<h2>New role</h2>
		<div class="pop-up-inputs">
			<TextInput ref={(e) => nameInput = e.htmlElement} placeholder="Role name" type="text" validator={(e) => validateFromZod(createProviderRoleSchema.shape.name, e.value)} required />
			<For each={providerPermissions}>
				{(permission) => <Checkbox
					checked={permissions().includes(permission)}
					onChange={(e) => togglePermission(permission, e.currentTarget.checked)}
					label={permission}
				/>}
			</For>
		</div>
		<div class="pop-up-buttons">
			<Button type="button" onClick={popUpControls.close} variant="text" size="md">Cancel</Button>
			<Button type="submit" size="md" disabled={isPending()}>Create</Button>
		</div>
	</Form>;
}, { customClass: "edition-pop-up", onClose });
