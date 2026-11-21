import TextInput from "~/components/inputs/TextInput";
import Form from "~/components/inputs/Form/Form";
import { createSignal, For, Show } from "solid-js";
import Button from "~/components/inputs/Button";
import { useProviderRolesQuery } from "~/api/queryHooks/providerManageRoles";
import { useProvider } from "~/components/guards/ProviderInfoGuard";
import { Menu } from "~/components/ui/Menu/Menu";
import { Plus, Search } from "lucide-solid";
import { ProviderUser } from "./ManageMembers";
import { A } from "@solidjs/router";
import { providerMemberAddRole } from "~/api/queryHooks/providerManageMembers";

export function AddRoleMenu(props: { user: ProviderUser }) {
	return <Menu
		align="left"
		class="add-role-menu"
		trigger={<div class="role"><Button variant="text" icon><Plus size={14}/></Button></div>}
	>
		{(close) => <AddRoleContent user={props.user} onClose={close} />}
	</Menu>;
}

function AddRoleContent(props: { user: ProviderUser; onClose: () => void }) {
	const provider = useProvider();
	const [searchQuery, setSearchQuery] = createSignal("");
	const rolesQuery = useProviderRolesQuery(provider);
	const [disableAddRole, setDisableAddRole] = createSignal(false);

	async function addRole(role: ProviderUser["roles"][number]) {
		setDisableAddRole(true);
		await providerMemberAddRole(provider, props.user.uuid, role);
		setDisableAddRole(false);
		props.onClose();
	}

	return <>
		<Form class="playlist-form search-form" onSubmit={(e) => {
			e.preventDefault();
		}}>
			<Search class="search-icon" size={15}/>
			<TextInput value={searchQuery()} placeholder="Search playlist" type="text" onInput={(e) => setSearchQuery(e.currentTarget.value)} />
		</Form>
		<A href={`/provider/${provider.uuid}/edit?tab=Roles`} class="subtext white-variant">Manage roles</A>
		<Show when={rolesQuery.data?.body.roles} keyed>
			{(roles) => <For each={roles.filter((r) => !props.user.roles.map((rl) => rl.uuid).includes(r.uuid)).filter((r) => r.name.toLowerCase().includes(searchQuery().toLowerCase()))}>
				{(role) => <button disabled={disableAddRole()} type="button" role="menuitem" onClick={() => void addRole(role)}>
					<span>{role.name}</span>
				</button>}
			</For>}
		</Show>
	</>;
}
