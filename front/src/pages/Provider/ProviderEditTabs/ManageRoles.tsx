import { createMemo, createSignal, For, Show } from "solid-js";
import { useProvider } from "~/components/guards/ProviderInfoGuard";
import Button from "~/components/inputs/Button";
import "./ManageRoles.scss";
import { Provider, providerPermissions, ProviderRole } from "@flex/shared";
import { deleteRole, useProviderRolesQuery } from "~/api/queryHooks/providerManageRoles";
import Checkbox from "~/components/inputs/Checkbox/Checkbox";
import { summonEditRolePopUp } from "../popUps/summonEditRolePopUp";
import { providerUpdateSettings } from "~/api/queryHooks/providerSettings";
import { Pencil, Trash } from "lucide-solid";

export function ManageRoles(props: { search: string }) {
	const provider = useProvider();
	const rolesQuery = useProviderRolesQuery(provider);

	const roles = createMemo(() => {
		return rolesQuery.data?.body ? rolesQuery.data?.body.roles.filter((r) => r.name.includes(props.search)) : [];
	});

	return <div id="manage-role-tab" class="tab-container">
		<Show when={roles().length} keyed fallback={<div>No role</div>}><section>
			<div class="roles-list">
				<For each={roles()}>{(role) => <ProviderRoleCard role={role} provider={provider}/>}</For>
			</div>
		</section></Show>

	</div>;
}

function ProviderRoleCard(props: { role: ProviderRole; provider: Provider }) {
	const [deleteRoleDisabled, setDeleteRoleDisabled] = createSignal<boolean>(false);
	const [defaultDisabled, setDefaultDisabled] = createSignal<boolean>(false);

	async function setDefault() {
		setDefaultDisabled(true);
		await providerUpdateSettings(props.provider, undefined, props.role.uuid);
		setDefaultDisabled(false);
	}

	async function remove() {
		setDeleteRoleDisabled(true);
		await deleteRole(props.provider, props.role.uuid);
		setDeleteRoleDisabled(false);
	}

	function edit() {
		summonEditRolePopUp(props.provider, props.role);
	}

	return <div class="role-card">
		<div class="infos">
			<div class="name">{props.role.name}</div>
			<div class="permissions">
				<For each={providerPermissions}>
					{(permission) => <Checkbox checked={!!props.role.permissions.find((p) => p === permission)} disabled={true} label={permission}/>}
				</For>
			</div>
		</div>
		<div class="actions">
			<Button variant="ghost" disabled={props.role.isDefault || defaultDisabled()} onClick={() => void setDefault()}>{props.role.isDefault ? "Default role" : "Set default"}</Button>
			<Button icon variant="ghost" onClick={edit}><Pencil size={18}/></Button>
			<Button icon variant="danger" disabled={deleteRoleDisabled()} onClick={() => void remove()}><Trash size={18}/></Button>
		</div>
	</div>;
}
