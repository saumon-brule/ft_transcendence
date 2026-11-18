import { createMemo, createResource, For, Show } from "solid-js";
import { getUsersBatch } from "~/api/queryHooks/userProfile";
import { useProviderInfo } from "~/components/guards/ProviderInfoGuard";
import Button from "~/components/inputs/Button";
import "./ManageMembers.scss";
import { A } from "@solidjs/router";
import { Plus, RefreshCcw, X } from "lucide-solid";
import { textToCSS } from "~/utils/tex2col";
import { Provider } from "@flex/shared";
import { providerRemoveMember, providerUserAccessDecide, useProviderMembersQuery, useProviderPendingMembersQuery } from "~/api/queryHooks/providerManageMembers";

type PendingUser = {
	status: "PENDING" | "APPROVED" | "REJECTED";
	uuid: string;
	createdAt: Date;
	userUuid: string;
	decidedBy: string | null;
	decidedAt: Date | null;
	avatarUrl: string;
	username: string;
};

type ProviderUser = {
	uuid: string;
	createdAt: Date;
	isOwner: boolean;
	roles: {
		uuid: string;
		name: string;
	}[];
	revokedAt: Date | null;
	avatarUrl: string;
	username: string;
};

function displayDate(date: Date | string) {
	const d = new Date(date);
	const pad = (n: number) => String(n).padStart(2, "0");
	return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${pad(d.getFullYear() % 100)} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function ManageMembers(props: { search: string }) {
	const providerInfo = useProviderInfo();
	const providerPendingMembersQuery = useProviderPendingMembersQuery(providerInfo);
	const providerMembersQuery = useProviderMembersQuery(providerInfo);

	const [pendingUsers] = createResource(
		() => providerPendingMembersQuery.data?.body.accessRequests,
		async (members) => {
			const list = members.length ? (await getUsersBatch(members.map((e) => e.userUuid))).users : [];
			return list.map((u) => { return { ...u, ...members.find((m) => m.userUuid === u.uuid)! }; });
		},
	);
	const pendingMembers = createMemo(() => {
		const search = props.search.trim().toLowerCase();
		const list = (pendingUsers() ?? []).filter((u) => u.username.toLowerCase().includes(search));
		return list.length ? list : undefined;
	});

	const [users] = createResource(
		() => providerMembersQuery.data?.body.members,
		async (members) => {
			const list = members.length ? (await getUsersBatch(members.map((e) => e.uuid))).users : [];
			return list.map((u) => { return { ...u, ...members.find((m) => m.uuid === u.uuid)! }; });
		},
	);
	const members = createMemo(() => {
		const search = props.search.trim().toLowerCase();
		const list = (users() ?? []).filter((u) => u.username.toLowerCase().includes(search));
		return list.length ? list.map((u) => { return { ...u, roles: [{ name: "admin", uuid: "0" }, { name: "manager", uuid: "0" }, { name: "truc", uuid: "0" }, { name: "musiqueur", uuid: "0" }, { name: "superpersonne", uuid: "0" }] }; }) : undefined;
	});

	const currentMembers = createMemo(() => {
		const ms = members();
		return ms ? ms.filter((m) => m.revokedAt === null) : undefined;
	});

	return <div id="manage-member-tab" class="tab-container">
		<section>
			<div class="section-header">
				<h2>Pending requests</h2>
				<Button size="sm" icon onClick={() => void providerPendingMembersQuery.refetch()}><RefreshCcw classList={{ spinning: providerPendingMembersQuery.isFetching }}/></Button>
			</div>
			<Show when={pendingMembers()} keyed fallback={<p class="empty-message">No pending requests at the moment.</p>}>{(members) => <div class="members-list">
				<For each={members}>{(member) => <PendingMemberCard member={member} provider={providerInfo}/>}</For>
			</div>}</Show>
		</section>
		<Show when={currentMembers()} keyed>{(members) => <section>
			<div class="section-header">
				<h2>Provider members</h2>
				<Button size="sm" icon onClick={() => void providerMembersQuery.refetch()}><RefreshCcw classList={{ spinning: providerMembersQuery.isFetching }}/></Button>
			</div>
			<div class="members-list">
				<For each={members}>{(member) => <ProviderMemberCard member={member} provider={providerInfo}/>}</For>
			</div>
		</section>}</Show>
	</div>;
}

function PendingMemberCard(props: { member: PendingUser; provider: Provider }) {

	async function acceptMember() {
		await providerUserAccessDecide(props.provider, props.member.uuid, true);
	}

	async function rejectMember() {
		await providerUserAccessDecide(props.provider, props.member.uuid, false);
	}

	return <div class="pending-member-card member-card">
		<div class="infos">
			<A class="username white-variant" href={`/user/${props.member.uuid}`}>{props.member.username}</A>
			<span class="date">Requested: {displayDate(props.member.createdAt)}</span>
		</div>
		<div class="actions">
			<Button variant="text" onClick={() => void acceptMember()}>Accept</Button>
			<Button variant="danger" onClick={() => void rejectMember()}>Reject</Button>
		</div>
	</div>;
}

function ProviderMemberCard(props: { member: ProviderUser; provider: Provider }) {

	async function removeMember() {
		await providerRemoveMember(props.provider, props.member.uuid);
	}

	return <div class="provider-member-card member-card">
		<div class="infos">
			<A class="username white-variant" href={`/user/${props.member.uuid}`}>{props.member.username}</A>
			<div class="roles">
				<Show when={props.member.isOwner}>
					<div class="role" style={{ "--role-color": "var(--text-accent-hover)" }}><span>Owner</span></div>
				</Show>
				<For each={props.member.roles}>{(role) => <div class="role" style={{ "--role-color": textToCSS(role.name) }}>
					<span>{role.name}</span>
					<Button variant="text" icon onClick={() => {}}><X size={14}/></Button>
				</div>}</For>
				<div class="role" onClick={() => {}}>
					<Button variant="text" icon><Plus size={14}/></Button>
				</div>
			</div>
		</div>
		<div class="actions">
			<Show when={!props.member.isOwner} fallback={<div class="owner">Owner</div>}>
				<Button variant="danger" onClick={() => void removeMember()}>Remove</Button>
			</Show>
		</div>
	</div>;
}
