import { RouteSectionProps } from "@solidjs/router";
import { AudioPlayerProvider } from "../../context/AudioManagerContext";
import Footer from "../Footer";
import Header from "../Header";
import "./AppContainer.scss";

export default function AppContainer(props: RouteSectionProps) {

	return <div id="app-container">
		<AudioPlayerProvider>
			<Header />
			{props.children}
			<Footer/>
		</AudioPlayerProvider>
	</div>;
}
