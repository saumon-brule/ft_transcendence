import { ChevronDown, LogOut, Search, Settings, X, User, Server, Users, SquareChevronLeft, SquareChevronRight } from "lucide-solid";
import { createEffect, createMemo, createSignal, onCleanup, onMount, Show } from "solid-js";
import Form from "~/components/inputs/Form/Form";
import TextInput from "~/components/inputs/TextInput";
import { authActions } from "~/store/auth.store";
import type { FormEmbeddedComponentRef } from "~/types/ComponentRef";
import { useMatch, useNavigate, useSearchParams } from "@solidjs/router";
import { useProfile } from "~/components/guards/ProfileGate";

import "./Header.scss";
import { hasUnreadMessages } from "~/store/messages.store";
import { Tab } from "~/pages/Search/Search";
import { isSidebarOpen, sidebarActions } from "~/store/sidebar.store";

export default function Header() {
	const me = useProfile();
	const navigate = useNavigate();

	const [isMenuOpen, setIsMenuOpen] = createSignal(false);
	const searchMatch = useMatch(() => "/search/:search?");
	const [searchValue, setSearchValue] = createSignal(searchMatch() ? decodeURIComponent(searchMatch()!.params.search ?? "") : "");
	createEffect(() => {
		setSearchValue(searchMatch() ? decodeURIComponent(searchMatch()!.params.search ?? "") : "");
	});
	let searchInput!: FormEmbeddedComponentRef<HTMLInputElement>;
	let profileMenu!: HTMLDivElement;

	const hasFriendNotification = createMemo(() => me().friendRequests.length > 0 || hasUnreadMessages());

	function handleDocumentClick(event: MouseEvent) {
		if (profileMenu && !profileMenu.contains(event.target as Node)) {
			setIsMenuOpen(false);
		}
	}


	let searchBasePage: null | string = null;
	let searchTimeout: ReturnType<typeof setTimeout> | undefined;
	const [searchParams] = useSearchParams<{ tab?: Tab }>();

	function goToSearch() {
		if (!searchBasePage && !searchMatch()) {
			searchBasePage = window.location.pathname;
		}

		const term = searchValue().trim();
		navigate(`/search${term ? `/${encodeURIComponent(term)}` : ""}${searchParams.tab ? `?tab=${searchParams.tab}` : ""}`, { replace: !!searchMatch() });
	}

	function search() {
		clearTimeout(searchTimeout);

		searchTimeout = setTimeout(() => {
			if (searchValue()) goToSearch();
		}, 300);
	}

	function submitSearch() {
		clearTimeout(searchTimeout);
		goToSearch();
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

				<Form class="header-search" role="search" onSubmit={submitSearch}>
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
					<img class="profile-avatar" src={me().avatarUrl}/>
					<span class="profile-username">{me().username}</span>
					<ChevronDown class="profile-chevron" size={16} aria-hidden="true" />
				</button>

				<Show when={isMenuOpen()}>
					<div class="profile-dropdown" role="menu">
						<button type="button" role="menuitem" onClick={() => { navigate(`/user/${me().uuid}`); setIsMenuOpen(false); }}>
							<User size={17} aria-hidden="true" />
							<span>Profile</span>
						</button>
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
