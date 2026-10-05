import { createSignal, For, Show } from "solid-js";
import type { User } from "@flex/shared";
import ProviderCard from "./ProviderCard";

type ProviderSectionProps = {
	title: string;
	emptyMessage: string;
	providers: User["ownedProviders"];
};

export default function ProviderSection(props: ProviderSectionProps) {
	const [showAll, setShowAll] = createSignal(false);

	return <section class="providers">
		<div class="section-heading">
			<h3>{props.title}</h3>
			<Show when={props.providers.length > 3}>
				<a href="#" onClick={(event) => { event.preventDefault(); setShowAll((value) => !value); }}>
					{showAll() ? "Show less" : "Show more"}
				</a>
			</Show>
		</div>
		<div class="providers-list">
			<Show when={props.providers.length > 0} fallback={<p class="no-providers">{props.emptyMessage}</p>}>
				<For each={showAll() ? props.providers : props.providers.slice(0, 3)}>{(provider) => <ProviderCard provider={provider} />}</For>
			</Show>
		</div>
	</section>;
}
