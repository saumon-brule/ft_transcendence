
import { RouteSectionProps } from "@solidjs/router";
import "./Settings.scss";


export default function Settings(props: RouteSectionProps) {
	// const [listeningPrivate, setListeningPrivate] = createSignal(false);


	// function updatePicture(e: Event) {
	// 	const file = (e.target as HTMLInputElement).files?.[0];
	// 	if (!file) return;
	// 	updatePictureMutation.mutate({
	// 		body: { avatar: file },
	// 	}, {
	// 		onSuccess: () => {
	// 			avatarUpdated();
	// 			summonSuccessToast("Avatar updated");
	// 		},
	// 		onError: () => summonErrorToast("Unable to update avatar"),
	// 	});
	// }

	return <div class="page" id="settings">
		{props.children}
	</div>;
}
