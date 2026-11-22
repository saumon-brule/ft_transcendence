import { createMemo, createResource, For, Show } from "solid-js";
import { getUsersBatch } from "~/api/queryHooks/userProfile";
import { useProvider } from "~/components/guards/ProviderInfoGuard";
import { useProfile } from "~/components/guards/ProfileGate";
import Button from "~/components/inputs/Button";
import "./ManageMembers.scss";
import { A } from "@solidjs/router";
import { RefreshCcw, X } from "lucide-solid";
import { textToCSS } from "~/utils/tex2col";
import { providerMemberRemoveRole, providerRemoveMember, providerUserAccessDecide, useProviderMembersQuery, useProviderPendingMembersQuery } from "~/api/queryHooks/providerManageMembers";
import { AddRoleMenu } from "./AddRoleMenu";
import { useProviderInfoInfo } from "~/components/guards/EditPermissionGuard";
import { locale, useTranslation } from "~/i18n/context";

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

export type ProviderUser = {
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
	return new Date(date).toLocaleString(locale(), { dateStyle: "short", timeStyle: "short" });
}

export function ManageMembers(props: { search: string }) {
	const { t } = useTranslation();
	const provider = useProvider();
	const providerPendingMembersQuery = useProviderPendingMembersQuery(provider);
	const providerMembersQuery = useProviderMembersQuery(provider);

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
		return list.length ? list : undefined;
	});

	const currentMembers = createMemo(() => {
		const ms = members();
		return ms ? ms.filter((m) => m.revokedAt === null) : undefined;
	});

	return <div id="manage-member-tab" class="tab-container">
		<section>
			<div class="section-header">
				<h2>{t("pages.provider.edit.pendingRequests")}</h2>
				<Button size="sm" icon onClick={() => void providerPendingMembersQuery.refetch()}><RefreshCcw classList={{ spinning: providerPendingMembersQuery.isFetching }}/></Button>
			</div>
			<Show when={pendingMembers()} keyed fallback={<p class="empty-message">{t("pages.provider.edit.noPendingRequests")}</p>}>{(members) => <div class="members-list">
				<For each={members}>{(member) => <PendingMemberCard member={member}/>}</For>
			</div>}</Show>
		</section>
		<Show when={currentMembers()} keyed>{(members) => <section>
			<div class="section-header">
				<h2>{t("pages.provider.edit.members")}</h2>
				<Button size="sm" icon onClick={() => void providerMembersQuery.refetch()}><RefreshCcw classList={{ spinning: providerMembersQuery.isFetching }}/></Button>
			</div>
			<div class="members-list">
				<For each={members}>{(member) => <ProviderMemberCard member={member}/>}</For>
			</div>
		</section>}</Show>
	</div>;
}

function PendingMemberCard(props: { member: PendingUser }) {
	const { t } = useTranslation();
	const provider = useProvider();

	async function acceptMember() {
		await providerUserAccessDecide(provider, props.member.uuid, true);
	}

	async function rejectMember() {
		await providerUserAccessDecide(provider, props.member.uuid, false);
	}

	return <div class="pending-member-card member-card">
		<div class="infos">
			<A class="username white-variant" href={`/user/${props.member.uuid}`}>{props.member.username}</A>
			<span class="date">{t("pages.provider.edit.requestedAt", { date: displayDate(props.member.createdAt) })}</span>
		</div>
		<div class="actions">
			<Button variant="text" onClick={() => void acceptMember()}>{t("components.friendshipActions.accept")}</Button>
			<Button variant="danger" onClick={() => void rejectMember()}>{t("pages.provider.edit.reject")}</Button>
		</div>
	</div>;
}

function ProviderMemberCard(props: { member: ProviderUser }) {
	const { t } = useTranslation();
	const provider = useProvider();
	const providerInfo = useProviderInfoInfo();
	const me = useProfile();

	async function removeMember() {
		await providerRemoveMember(provider, props.member.uuid);
	}

	async function removeRole(roleUuid: string) {
		await providerMemberRemoveRole(provider, props.member.uuid, roleUuid);
	}

	return <div class="provider-member-card member-card">
		<div class="infos">
			<A class="username white-variant" href={`/user/${props.member.uuid}`}>{props.member.username}</A>
			<div class="roles">
				<Show when={props.member.isOwner}>
					<div class="role" style={{ "--role-color": "var(--text-accent-hover)" }}><span>{t("pages.provider.edit.owner")}</span></div>
				</Show>
				<For each={props.member.roles}>{(role) => <div class="role" style={{ "--role-color": textToCSS(role.name) }}>
					<span>{role.name}</span>
					<Show when={providerInfo.member.isOwner || providerInfo.member.permissions.includes("ADMIN")}>
						<Button variant="text" icon onClick={() => void removeRole(role.uuid)}><X size={14}/></Button>
					</Show>
				</div>}</For>
				<Show when={providerInfo.member.isOwner || providerInfo.member.permissions.includes("ADMIN")}>
					<AddRoleMenu user={props.member}/>
				</Show>
			</div>
		</div>
		<div class="actions">
			<Show when={!props.member.isOwner} fallback={<div class="owner">{t("pages.provider.edit.owner")}</div>}>
				<Show when={props.member.uuid !== me().uuid} fallback={<div class="owner">{t("pages.provider.edit.myself")}</div>}>
					<Button variant="danger" onClick={() => void removeMember()}>{t("common.remove")}</Button>
				</Show>
			</Show>
		</div>
	</div>;
}
