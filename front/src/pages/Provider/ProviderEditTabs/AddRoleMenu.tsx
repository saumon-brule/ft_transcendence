import TextInput from "~/components/inputs/TextInput";
import Form from "~/components/inputs/Form/Form";
import { createSignal, For, Show } from "solid-js";
import Button from "~/components/inputs/Button";
import { useProviderRolesQuery } from "~/api/queryHooks/providerManageRoles";
import { Provider } from "@flex/shared";
import { Menu } from "~/components/ui/Menu/Menu";
import { Plus, Search } from "lucide-solid";
import { ProviderUser } from "./ManageMembers";
import { A } from "@solidjs/router";

export function AddRoleMenu(props: { provider: Provider; user: ProviderUser }) {
	return <Menu
		align="left"
		class="add-role-menu"
		trigger={<div class="role"><Button variant="text" icon><Plus size={14}/></Button></div>}
	>
		{(close) => <AddRoleContent provider={props.provider} user={props.user} onClose={close} />}
	</Menu>;
}

function AddRoleContent(props: { provider: Provider; user: ProviderUser; onClose: () => void }) {
	const [searchQuery, setSearchQuery] = createSignal("");
	// eslint-disable-next-line solid/reactivity -- y'a pas d'update du provider de toute façon
	const rolesQuery = useProviderRolesQuery(props.provider);

	return <>
		<Form class="playlist-form search-form" onSubmit={(e) => {
			e.preventDefault();
		}}>
			<Search class="search-icon" size={15}/>
			<TextInput value={searchQuery()} placeholder="Search playlist" type="text" onInput={(e) => setSearchQuery(e.currentTarget.value)} />
		</Form>
		<A href={`/provider/${props.provider.uuid}/edit?tab=Roles`} class="subtext white-variant">Manage roles</A>
		<Show when={rolesQuery.data?.body.roles} keyed>
			{(roles) => <For each={roles.filter((r) => r.name.toLowerCase().includes(searchQuery().toLowerCase()))}>
				{(role) => <button type="button" role="menuitem" onClick={() => {}}>
					<span>{role.name}</span>
				</button>}
			</For>}
		</Show>
	</>;
}
