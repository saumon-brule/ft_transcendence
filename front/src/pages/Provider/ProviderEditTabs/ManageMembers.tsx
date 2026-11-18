import { createMemo, For, Show } from "solid-js";
import { useProviderMembersQuery, useProviderPendingMembersQuery } from "~/api/queryHooks/providerInfo";
import { useProviderInfo } from "~/components/guards/ProviderInfoGuard";


export function ManageMembers(props: { search: string }) {
	const providerInfo = useProviderInfo();
	const providerPendingMembersQuery = useProviderPendingMembersQuery(providerInfo);
	const providerMembersQuery = useProviderMembersQuery(providerInfo);
	const pendingMembers = createMemo(() => {
		const search = props.search.trim().toLowerCase();
		const all = providerPendingMembersQuery.data?.body;
		if (!all || !search) return all;
		return all.filter((accessRequest) => accessRequest.uuid.toLowerCase().includes(search));
	});

	const members = createMemo(() => {
		const search = props.search.trim().toLowerCase();
		const all = providerMembersQuery.data?.body.members;
		if (!all || !search) return all;
		return all.filter((member) => member.uuid.toLowerCase().includes(search));
	});

	return <Show when={members()} keyed>{(members) => <div>
		<For each={members}>{(member) => <div class="member-card">
			{member.uuid}
		</div>}</For>
	</div>}</Show>;
}
