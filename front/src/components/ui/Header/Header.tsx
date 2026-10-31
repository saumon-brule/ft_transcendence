import { ChevronDown, LogOut, Search, Settings, X, User, Server, Users } from "lucide-solid";
import { createMemo, createSignal, onCleanup, onMount, Show } from "solid-js";
import Form from "~/components/inputs/Form/Form";
import TextInput from "~/components/inputs/TextInput";
import { authActions } from "~/store/auth.store";
import type { FormEmbeddedComponentRef } from "~/types/ComponentRef";
import { useNavigate } from "@solidjs/router";
import { useMeProfileQuery } from "~/api/queryHooks/meProfile";

import "./Header.scss";
import { hasUnreadMessages } from "~/store/messages.store";

export default function Header() {
	const meProfileQuery = useMeProfileQuery();
	const navigate = useNavigate();

	const [isMenuOpen, setIsMenuOpen] = createSignal(false);
	const [searchValue, setSearchValue] = createSignal("");
	let searchInput!: FormEmbeddedComponentRef<HTMLInputElement>;
	let profileMenu!: HTMLDivElement;

	const hasFriendNotification = createMemo(() =>
		(meProfileQuery.data?.body.friendRequests.length ?? 0) > 0 || hasUnreadMessages()
	);

	function handleDocumentClick(event: MouseEvent) {
		if (profileMenu && !profileMenu.contains(event.target as Node)) {
			setIsMenuOpen(false);
		}
	}

	onMount(() => document.addEventListener("click", handleDocumentClick));
	onCleanup(() => document.removeEventListener("click", handleDocumentClick));

	return <header id="app-header">
		<div class="header-content">
			<div class="header-leading">
				<a class="header-brand" href="/home" aria-label="Flex home">Flex</a>

				<Form class="header-search" role="search">
					<Search class="search-icon" size={18}/>
					<TextInput
						type="search"
						placeholder="Search"
						aria-label="Search"
						value={searchValue()}
						onInput={(event) => setSearchValue(event.currentTarget.value)}
						ref={searchInput}
					/>
					<Show when={searchValue()}>
						<button
							class="search-clear"
							type="button"
							aria-label="Erase"
							onClick={() => {
								setSearchValue("");
								searchInput.htmlElement.focus();
							}}
						>
							<X size={17} aria-hidden="true" />
						</button>
					</Show>
				</Form>
			</div>

			<div class="profile-menu" ref={profileMenu}>
				<button
					class="profile-trigger"
					type="button"
					aria-expanded={isMenuOpen()}
					aria-haspopup="menu"
					onClick={() => setIsMenuOpen((open) => !open)}
				>
					<Show when={meProfileQuery.data ? meProfileQuery.data.body : undefined}>
						{(user) => <>
							<img class="profile-avatar" src={user().avatarUrl}/>
							<span class="profile-username">{user().username}</span>
						</>}
					</Show>
					<ChevronDown class="profile-chevron" size={16} aria-hidden="true" />
				</button>

				<Show when={isMenuOpen()}>
					<div class="profile-dropdown" role="menu">
						<Show when={meProfileQuery.data ? meProfileQuery.data.body : undefined}>
							{(user) => <button type="button" role="menuitem" onClick={() => { navigate(`/user/${user().uuid}`); setIsMenuOpen(false); }}>
								<User size={17} aria-hidden="true" />
								<span>Profile</span>
							</button>}
						</Show>
						<button type="button" role="menuitem" onClick={() => { navigate("/friends"); setIsMenuOpen(false); }}>
							<span class="icon-badge" classList={{ notification: hasFriendNotification() }}>
								<Users size={17} aria-hidden="true" />
							</span>
							<span>Friends</span>
						</button>
						<button type="button" role="menuitem" onClick={() => { navigate("/settings"); setIsMenuOpen(false); }}>
							<Settings size={17} aria-hidden="true" />
							<span>Settings</span>
						</button>
						<button type="button" role="menuitem" onClick={() => { navigate("/providers"); setIsMenuOpen(false); }}>
							<Server size={17} aria-hidden="true" />
							<span>Providers</span>
						</button>
						<button type="button" role="menuitem" onClick={() => authActions.logout()}>
							<LogOut size={17} aria-hidden="true" />
							<span>Logout</span>
						</button>
					</div>
				</Show>
			</div>
		</div>
	</header>;
}
