
import { A, RouteSectionProps } from "@solidjs/router";
import { useTranslation } from "~/i18n/context";
import "./Settings.scss";


export default function Settings(props: RouteSectionProps) {
	const { t } = useTranslation();


	return <div class="page" id="settings">
		<div class="settings-layout">
			<nav class="settings-nav">
				<ul>
					<li>
						<A href="/settings/account">{t("pages.settings.accountLink") || "Account"}</A>
					</li>
					<li>
						<A href="/settings/profile">{t("pages.settings.profileLink") || "Profile"}</A>
					</li>
				</ul>
			</nav>
			{props.children}
		</div>
	</div>;
}
