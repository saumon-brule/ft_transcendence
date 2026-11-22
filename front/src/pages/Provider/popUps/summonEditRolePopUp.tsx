import { createProviderRoleSchema, Provider, ProviderPermission, providerPermissions, ProviderRole } from "@flex/shared";
import { createSignal, For } from "solid-js";
import { providerUpdateRole } from "~/api/queryHooks/providerManageRoles";
import Button from "~/components/inputs/Button";
import Checkbox from "~/components/inputs/Checkbox/Checkbox";
import Form from "~/components/inputs/Form/Form";
import TextInput from "~/components/inputs/TextInput";
import { summonPopUp } from "~/components/ui/Overlay";
import { summonSuccessToast } from "~/components/ui/Toaster";
import { validateFromZod } from "~/utils/validateFromZod";
import { t } from "~/i18n/context";

export const summonEditRolePopUp = (provider: Provider, role: ProviderRole, onClose?: () => void) => summonPopUp((popUpControls) => {
	const [permissions, setPermissions] = createSignal<Array<ProviderPermission>>([...role.permissions]);
	const [isPending, setIsPending] = createSignal(false);

	let nameInput!: HTMLInputElement;

	function togglePermission(permission: ProviderPermission, checked: boolean) {
		setPermissions((prev) => checked ? [...prev, permission] : prev.filter((p) => p !== permission));
	}

	async function handleSubmit(e: SubmitEvent) {
		e.preventDefault();
		setIsPending(true);
		const success = await providerUpdateRole(provider, role.uuid, nameInput.value.trim(), permissions());
		setIsPending(false);
		if (success) {
			summonSuccessToast(t("pages.provider.popUps.role.updated"));
			popUpControls.close();
		}
	}

	return <Form onSubmit={(e) => void handleSubmit(e)}>
		<h2>{t("pages.provider.popUps.role.editTitle")}</h2>
		<div class="pop-up-inputs">
			<TextInput ref={(e) => nameInput = e.htmlElement} value={role.name} placeholder={t("pages.provider.popUps.role.namePlaceholder")} type="text" validator={(e) => validateFromZod(createProviderRoleSchema.shape.name, e.value)} required />
			<For each={providerPermissions}>
				{(permission) => <Checkbox
					checked={permissions().includes(permission)}
					onChange={(e) => togglePermission(permission, e.currentTarget.checked)}
					label={t(`pages.provider.permissions.${permission}`)}
				/>}
			</For>
		</div>
		<div class="pop-up-buttons">
			<Button type="button" onClick={popUpControls.close} variant="text" size="md">{t("common.cancel")}</Button>
			<Button type="submit" size="md" disabled={isPending()}>{t("common.save")}</Button>
		</div>
	</Form>;
}, { customClass: "edition-pop-up", onClose });
