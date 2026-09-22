import { onCleanup, onMount } from "solid-js";
import { tsParticles, type Container } from "@tsparticles/engine";
import { loadLinksPreset } from "@tsparticles/preset-links";

let particles: Promise<void> | undefined;

const ensureParticlesSetup = () => {
	if (!particles) {
		particles = (async () => {
			await loadLinksPreset(tsParticles);
			await tsParticles.init();
		})();
	}

	return particles;
};

export default function LinkParticles() {
	let element!: HTMLDivElement;
	let container: Container | undefined;

	const initializeParticles = async () => {
		try {
			await ensureParticlesSetup().catch(() => { return; });

			container = await tsParticles.load({
				element,
				options: {
					preset: "links",
					background: {
						color: "transparent",
					},
					fullScreen: {
						enable: true,
						zIndex: -1,
					},
					particles: {
						number: {
							value: 80,
						},
						size: {
							value: {
								min: 2,
								max: 4,
							},
						},
						links: {
							enable: true,
							distance: 150,
							color: "random",
							opacity: 0.4,
							width: 1,
						},
						move: {
							enable: true,
							speed: 1,
						},

					},
				},
			});
		} catch (error) {
			console.error("Failed to initialize particles:", error);
		}
	};

	onMount(() => {
		void initializeParticles();
	});

	onCleanup(() => {
		container?.destroy();
	});

	return <div ref={element} id="tsparticles" />;
}
