import { RouteSectionProps } from "@solidjs/router";
import { AudioPlayerProvider } from "./context/AudioManagerContext";
import { ProfileProvider } from "./context/ProfileContext";
import Footer from "./ui/Footer/Footer";
import Header from "./ui/Header/Header";
import Sidebar from "./ui/Sidebar/Sidebar";
import "./AppContainer.scss";

export default function AppContainer(props: RouteSectionProps) {

	return <div id="app-container">
		<AudioPlayerProvider>
			<ProfileProvider>
				<Header/>
				<div id="app-body">
					<Sidebar/>
					<main>{props.children}</main>
				</div>
				<Footer/>
			</ProfileProvider>
		</AudioPlayerProvider>
	</div>;
}
