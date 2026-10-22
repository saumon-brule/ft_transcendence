import { For, Show } from "solid-js";
import { client, queryKeys } from "~/api/client";
import { summonErrorToast, summonSuccessToast } from "~/components/ui/Toaster";
import { summonPopUp } from "~/components/ui/Overlay";
import "./Providers.scss";
import ProviderCard from "./ProviderCard";
import Button from "~/components/ui/Button";
import { Plus } from "lucide-solid";
import { type User, createProviderSchema } from "@flex/shared";
import Form from "~/components/ui/Form/Form";
import TextInput from "~/components/ui/TextInput";
import { validateFromZod } from "~/utils/validateFromZod";

// export const createProviderSchema = z.object({
// 	name: z.string().trim().min(1).
// 		max(50),
// 	address: z.string().trim().max(255).
// 		refine(isPlainHttpUrl, { message: "The address must be an https:// URL, without credentials" }),
// 	publicDisplay: z.boolean().default(true),
// });

// function NewProviderPopUp(close: () => void) {
function NewProviderPopUp() {
	let nameInput!: HTMLInputElement;
	let addressInput!: HTMLInputElement;
	let publicDisplayInput!: HTMLInputElement;

	const newProviderMutation = client.providers.create.createMutation();

	const handleSubmit = (e: SubmitEvent) => {
		e.preventDefault();

		newProviderMutation.mutate(
			{ body: { name: nameInput.value, address: addressInput.value, publicDisplay: publicDisplayInput.checked } },
			{
				onSuccess: (data) => {
					summonSuccessToast("Provider created successfully");
					// close();
					console.log(data);
				},
				onError: () => {
					summonErrorToast("Provider created successfully");
				},
			},
		);
	};

	return <div style={{ padding: "1rem" }}>
		<h2>New provider</h2>
		<Form onSubmit={handleSubmit}>
			<TextInput ref={(e) => nameInput = e.htmlElement} name="providerName" placeholder="My provider" validator={(e) => validateFromZod(createProviderSchema.shape.name, e.value)} required/>
			<TextInput ref={(e) => addressInput = e.htmlElement} name="providerAddress" placeholder="https://my-provider.com" validator={(e) => validateFromZod(createProviderSchema.shape.address, e.value)} required/>
			{/* <TextInput ref={(e) => publicDisplayInput = e.htmlElement} name="providerPublicDisplay" type="checkbox" checked={true} /> */}
			<Button type="submit">Create</Button>
		</Form>
	</div>;
}

type EditProviderProps = {
	provider: User["ownedProviders"][number];
};
function EditProviderPopUp(props: EditProviderProps) {
	return <div style={{ padding: "1rem" }}>
		<h2>Edit provider</h2>
		<p>Coming soon...</p>
	</div>;
}

export default function Providers() {
	const me = client.users.me.createQuery(queryKeys.users.me, () => ({}));

	return <div id="providers-page">
		<div class="providers-header">
			<h1>My Providers</h1> {/* ({ close }) => <NewProviderPopUp/> */}
			<Button onClick={() => summonPopUp(<NewProviderPopUp/>)}><Plus/>New provider</Button>
		</div>
		{/* <Show when={me.data} keyed>{(data) => <>
			<For each={data.body.ownedProviders}>{(provider) => <ProviderCard provider={provider} mine={true} />}</For>
			<pre><code>{JSON.stringify(data.body.ownedProviders, null, 2)}</code></pre>
		</>}</Show> */}
	</div>;
}
