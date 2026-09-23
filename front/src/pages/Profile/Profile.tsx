import { useNavigate, useParams } from "@solidjs/router";
import { createEffect, For, Show } from "solid-js";
import { client, queryKeys } from "~/api/client";
import { summonErrorToast } from "~/components/ui/Toaster";

export default function Profile() {
	const params = useParams<{ uuid: string }>();
	const navigate = useNavigate();

	const profile = client.users.getUser.createQuery(queryKeys.users.getUser, {
		params: { uuid: params.uuid },
	});

	createEffect(() => {
		if (profile.isError) {
			navigate("/home");
			summonErrorToast("Unknown user");
		} else if (profile.isSuccess) {
			console.log(profile.data?.body);
		}
	});

	return <div id="user-profile">
		<Show when={profile.data} keyed>{(data) => <>
			<div class="profile-header">
				<img src={data.body.picture ?? "/images/default-profile.png"} alt="Profile picture" />
				<div class="header-info">
					<h2>{data.body.username}</h2>
					<div class="user-stats"><p>Joined on {new Date(data.body.createdAt).toLocaleDateString()}</p><p>{data.body.providers.length} provider(s) connectés</p><p>{data.body.ownedProviders.length} providers possédés</p><p>{data.body.ownedPlaylists.length} playlists</p></div>
					<div class="listening">Currently listening to SAVE LA DATA MUSIQUE EN COURS</div>
				</div>
			</div>
			<section class="providers">
				<h3>Connected providers</h3>
				<div class="providers-list">
					<Show when={data.body.providers.length > 0}>
						<For each={data.body.providers}>{(provider) => <div class="provider-card">
							<img src="/images/default-provider.png" alt="Provider logo" />
							<div class="provider-info">
								<h4>{provider.name}</h4>
								<p>{provider.adress}</p>
							</div>
						</div>}</For>
					</Show>
					<Show when={data.body.providers.length === 0}>
						<p class="no-providers">No connected providers</p>
					</Show>
				</div>
			</section>
			<section class="providers">
				<h3>Owned providers</h3>
				<div class="providers-list">
					<Show when={data.body.ownedProviders.length > 0}>
						<For each={data.body.ownedProviders}>{(provider) => <div class="provider-card">
							<img src="/images/default-provider.png" alt="Provider logo" />
							<div class="provider-info">
								<h4>{provider.name}</h4>
								<p>{provider.adress}</p>
							</div>
						</div>}</For>
					</Show>
					<Show when={data.body.ownedProviders.length === 0}>
						<p class="no-providers">No owned providers</p>
					</Show>
				</div>
			</section>
			<section class="playlists">
				<h3>Playlists</h3>
				<div class="playlists-list">
					<Show when={data.body.ownedPlaylists.length > 0}>
						<For each={data.body.ownedPlaylists}>{(playlist) => <div class="playlist-card">
							<img src="/images/default-playlist.png" alt="playlist logo" />
							<div class="playlist-info">
								<h4>{playlist.name}</h4>
								<p>{playlist._count.musics} musics</p>
							</div>
						</div>}</For>
					</Show>
					<Show when={data.body.ownedPlaylists.length === 0}>
						<p class="no-providers">No owned playlists</p>
					</Show>
				</div>
			</section>
			{/* Same pour les friends */}
		</>}</Show>
	</div>;
}
