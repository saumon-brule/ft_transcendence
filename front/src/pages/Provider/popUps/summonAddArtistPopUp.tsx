import { summonPopUp } from "~/components/ui/overlays/Overlay";
import { DEFAULT_ARTIST } from "~/utils/imageFallback";
import TextInput from "~/components/inputs/TextInput";
import Button from "~/components/inputs/Button";
import { createMemo, createSignal, onCleanup, Show } from "solid-js";
import Form from "~/components/inputs/Form/Form";
import { getProviderClient } from "~/api/providerClients";
import { Provider, providerContract } from "@flex/shared";
import { settleResponse } from "~/api/utils/settleResponse";
import UploadProgress from "~/components/ui/feedback/UploadProgress";
import { summonErrorToast } from "~/components/ui/feedback/Toaster";
import "./AddArtistPopUp.scss";
import { Artist } from "~/class/Artist";
import { t } from "~/i18n/context";
import { devWarn } from "~/utils/devLog";
import { invalidateProviderCatalog } from "~/api/queryHooks/providerManageCatalog";

export function summonAddArtistPopUp(provider: Provider, nameHint: string = "", onNewArtist?: (newArtist: Artist) => void) {
	const providerClient = getProviderClient(provider.address, provider.uuid);
	return summonPopUp((props) => {
		const [name, setName] = createSignal(nameHint);
		const [avatar, setAvatar] = createSignal<File | null>(null);

		const artistCreateMutation = providerClient.client.artist.create.createMutation();
		const artistUploadAvatarMutation = providerClient.client.artist.uploadAvatar.createMutation();
		const artistRemoveMutation = providerClient.client.artist.remove.createMutation();

		const [avatarProgress, setAvatarProgress] = createSignal(0);

		const avatarPreviewUrl = createMemo(() => {
			const f = avatar();
			if (!f) return null;
			const url = URL.createObjectURL(f);
			onCleanup(() => URL.revokeObjectURL(url));
			return url;
		});

		let fileInputRef!: HTMLInputElement;

		const handleSubmit = async () => {
			let createdUuid: string | null = null;
			const failCreation = (status?: number) => {
				if (status === 413) summonErrorToast(() => t("pages.provider.popUps.fileTooLarge"));
				else if (status === 415) summonErrorToast(() => t("pages.provider.popUps.fileNotSupported"));
				else summonErrorToast(() => t("pages.provider.popUps.artist.createError"));
				if (createdUuid) void artistRemoveMutation.mutate({ params: { uuid: createdUuid } });
			};

			try {
				const createRes = await settleResponse(
					artistCreateMutation.mutateAsync({ body: { name: name() } }),
					providerContract.artist.create,
				);
				if (createRes.status !== 201) {
					failCreation(createRes.status);
					return;
				}

				const newArtist = createRes.body;
				const uuid = newArtist.uuid;
				createdUuid = uuid;

				const curAvatar = avatar();
				if (curAvatar) {
					const uploadAvatarRes = await settleResponse(artistUploadAvatarMutation.mutateAsync({
						params: { uuid },
						body: { file: curAvatar },
						onUploadProgress: setAvatarProgress,
					}), providerContract.artist.uploadAvatar);
					if (uploadAvatarRes.status !== 204) {
						failCreation(uploadAvatarRes.status);
						return;
					}
					newArtist.hasAvatar = true;
				}
				invalidateProviderCatalog(provider);
				onNewArtist?.(Artist.fromRawObject(newArtist, provider));
				props.close();
			} catch (e) {
				devWarn(e);
				failCreation();
			}
		};

		const isPending = () => artistCreateMutation.isPending || artistUploadAvatarMutation.isPending || artistRemoveMutation.isPending;

		return <Form class="create-artist-pop-up" onSubmit={() => { void handleSubmit(); }}>
			<h2 >{t("pages.provider.popUps.artist.addTitle")}</h2>
			<div class="create-artist-info">
				<div class="create-artist-avatar-box">
					<input
						ref={fileInputRef}
						type="file"
						accept="image/jpeg,image/png,image/webp,image/avif"
						style={{ display: "none" }}
						onChange={(e) => setAvatar(e.currentTarget.files?.[0] ?? null)}
					/>
					<img src={avatarPreviewUrl() ?? DEFAULT_ARTIST} onClick={() => fileInputRef.click()}/>
				</div>
				<div class="create-artist-details">
					<TextInput placeholder={t("pages.provider.popUps.namePlaceholder")} class="create-artist-artist-name" onChange={(a) => setName(a.currentTarget.value)} value={name()} />
				</div>
			</div>
			<Show when={artistUploadAvatarMutation.isPending}>
				<UploadProgress label={t("pages.provider.popUps.avatarUpload")} value={avatarProgress()}/>
			</Show>
			<div class="create-artist-pop-up-controls">
				<Button disabled={isPending()} type="button" variant="ghost" onClick={props.close}>{t("common.cancel")}</Button>
				<Button disabled={isPending()} type="submit">{t("pages.provider.popUps.upload")}</Button>
			</div>
		</Form>;
	});
}
