import { ChevronDown, LogOut, Search, Settings, X, User, Server, Users, SquareChevronLeft, SquareChevronRight } from "lucide-solid";
import { createEffect, createMemo, createSignal, onCleanup, onMount, Show } from "solid-js";
import Form from "~/components/inputs/Form/Form";
import TextInput from "~/components/inputs/TextInput";
import { authActions } from "~/store/auth.store";
import type { FormEmbeddedComponentRef } from "~/types/ComponentRef";
import { useMatch, useNavigate, useSearchParams } from "@solidjs/router";
import { useMeProfileQuery } from "~/api/queryHooks/meProfile";

import "./Header.scss";
import { hasUnreadMessages } from "~/store/messages.store";
import { Tab } from "~/pages/Search/Search";
import { isSidebarOpen, sidebarActions } from "~/store/sidebar.store";

export default function Header() {
	const meProfileQuery = useMeProfileQuery();
	const navigate = useNavigate();

	const [isMenuOpen, setIsMenuOpen] = createSignal(false);
	const searchMatch = useMatch(() => "/search/:search");
	const [searchValue, setSearchValue] = createSignal(searchMatch() ? decodeURIComponent(searchMatch()!.params.search ?? "") : "");
	createEffect(() => {
		setSearchValue(searchMatch() ? decodeURIComponent(searchMatch()!.params.search ?? "") : "");
	});
	let searchInput!: FormEmbeddedComponentRef<HTMLInputElement>;
	let profileMenu!: HTMLDivElement;

	const hasFriendNotification = createMemo(() => (meProfileQuery.data?.body.friendRequests.length ?? 0) > 0 || hasUnreadMessages());

	function handleDocumentClick(event: MouseEvent) {
		if (profileMenu && !profileMenu.contains(event.target as Node)) {
			setIsMenuOpen(false);
		}
	}


	let searchBasePage: null | string = null;
	let searchTimeout: ReturnType<typeof setTimeout> | undefined;
	const [searchParams] = useSearchParams<{ tab?: Tab }>();

	function search() {
		clearTimeout(searchTimeout);

		searchTimeout = setTimeout(() => {
			if (!searchBasePage && !searchMatch()) {
				searchBasePage = window.location.pathname;
			}

			if (searchValue()) {
				navigate(`/search/${encodeURIComponent(searchValue())}${searchParams.tab ? `?tab=${searchParams.tab}` : ""}`, { replace: !!searchMatch() });
			}
		}, 300);
	}

	onMount(() => document.addEventListener("click", handleDocumentClick));
	onCleanup(() => document.removeEventListener("click", handleDocumentClick));

	return <header id="app-header">
		<div class="header-content">
			<div class="header-leading">
				<a class="header-brand" href="/home" aria-label="Flex home">Flex</a>
				<button
					class="sidebar-toggle"
					type="button"
					aria-label={isSidebarOpen() ? "Close sidebar" : "Open sidebar"}
					aria-expanded={isSidebarOpen()}
					aria-controls="app-sidebar"
					onClick={() => sidebarActions.toggle()}
				>
					<Show when={isSidebarOpen()} fallback={<SquareChevronRight size={26} aria-hidden="true" />}>
						<SquareChevronLeft size={26} aria-hidden="true" />
					</Show>
				</button>

				<Form class="header-search" role="search">
					<Search class="search-icon" size={18}/>
					<TextInput
						type="search"
						placeholder="Search"
						aria-label="Search"
						value={searchValue()}
						onInput={(event) => { setSearchValue(event.currentTarget.value); search(); }}
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
								navigate(searchBasePage ?? "/home", { replace: true });
								searchBasePage = null;
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
