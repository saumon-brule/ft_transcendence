import { A } from "@solidjs/router";
import LegalLayout from "./LegalLayout";
import { legalInfo } from "./legalInfo";
import { useTranslation } from "~/i18n/context";

export default function PrivacyPolicy() {
	const { t } = useTranslation();
	const mail = `mailto:${legalInfo.contactEmail}`;
	const service = { service: legalInfo.serviceName };

	return <LegalLayout title={t("pages.legal.privacy.title")}>
		<p>
			{t("pages.legal.privacy.intro.begin", service)}<strong>{legalInfo.operator}</strong>{t("pages.legal.privacy.intro.end", service)}
		</p>

		<section>
			<h2>{t("pages.legal.privacy.whatIsFlex.title")}</h2>
			<p>
				{t("pages.legal.privacy.whatIsFlex.begin")}<strong>{t("pages.legal.privacy.whatIsFlex.providers")}</strong>{t("pages.legal.privacy.whatIsFlex.end")}
			</p>
		</section>

		<section>
			<h2>{t("pages.legal.privacy.collect.title")}</h2>
			<h3>{t("pages.legal.privacy.collect.account.title")}</h3>
			<ul>
				<li>{t("pages.legal.privacy.collect.account.email")}</li>
				<li>{t("pages.legal.privacy.collect.account.password")}</li>
				<li>{t("pages.legal.privacy.collect.account.intra")}</li>
				<li>{t("pages.legal.privacy.collect.account.avatar")}</li>
			</ul>
			<h3>{t("pages.legal.privacy.collect.activity.title")}</h3>
			<ul>
				<li>{t("pages.legal.privacy.collect.activity.friends")}</li>
				<li>{t("pages.legal.privacy.collect.activity.playlists")}</li>
				<li>{t("pages.legal.privacy.collect.activity.providers")}</li>
				<li>{t("pages.legal.privacy.collect.activity.listening")}</li>
			</ul>
			<h3>{t("pages.legal.privacy.collect.sessions.title")}</h3>
			<ul>
				<li>{t("pages.legal.privacy.collect.sessions.sessions")}</li>
				<li>{t("pages.legal.privacy.collect.sessions.tokens")}</li>
			</ul>
		</section>

		<section>
			<h2>{t("pages.legal.privacy.why.title")}</h2>
			<ul>
				<li><strong>{t("pages.legal.privacy.why.service.label")}</strong>{t("pages.legal.privacy.why.service.content")}</li>
				<li><strong>{t("pages.legal.privacy.why.security.label")}</strong>{t("pages.legal.privacy.why.security.content")}</li>
				<li><strong>{t("pages.legal.privacy.why.emails.label")}</strong>{t("pages.legal.privacy.why.emails.content")}</li>
			</ul>
			<p>{t("pages.legal.privacy.why.noSale")}</p>
		</section>

		<section>
			<h2>{t("pages.legal.privacy.cookies.title")}</h2>
			<p>{t("pages.legal.privacy.cookies.intro")}</p>
			<ul>
				<li><code>refresh_token</code>{t("pages.legal.privacy.cookies.refreshToken")}</li>
				<li>{t("pages.legal.privacy.cookies.localStorage")}</li>
			</ul>
			<p>{t("pages.legal.privacy.cookies.noTrackers")}</p>
		</section>

		<section>
			<h2>{t("pages.legal.privacy.visibility.title")}</h2>
			<ul>
				<li><strong>{t("pages.legal.privacy.visibility.users.label")}</strong>{t("pages.legal.privacy.visibility.users.content")}</li>
				<li><strong>{t("pages.legal.privacy.visibility.operators.label")}</strong>{t("pages.legal.privacy.visibility.operators.content")}</li>
				<li><strong>42</strong>{t("pages.legal.privacy.visibility.intra")}</li>
				<li><strong>{t("pages.legal.privacy.visibility.email.label")}</strong>{t("pages.legal.privacy.visibility.email.content")}</li>
				<li><strong>{t("pages.legal.privacy.visibility.host.label")}</strong>{t("pages.legal.privacy.visibility.host.content", { host: legalInfo.hostingLocation })}</li>
			</ul>
		</section>

		<section>
			<h2>{t("pages.legal.privacy.retention.title")}</h2>
			<ul>
				<li>{t("pages.legal.privacy.retention.account")}</li>
				<li>{t("pages.legal.privacy.retention.sessions")}</li>
				<li>{t("pages.legal.privacy.retention.tokens")}</li>
			</ul>
		</section>

		<section>
			<h2>{t("pages.legal.privacy.rights.title")}</h2>
			<p>
				{t("pages.legal.privacy.rights.p1")}<a href={mail}>{legalInfo.contactEmail}</a>.
			</p>
			<p>
				{t("pages.legal.privacy.rights.p2.begin")}<a href="https://www.cnil.fr">cnil.fr</a>{t("pages.legal.privacy.rights.p2.end")}
			</p>
		</section>

		<section>
			<h2>{t("pages.legal.privacy.security.title")}</h2>
			<p>{t("pages.legal.privacy.security.content")}</p>
		</section>

		<section>
			<h2>{t("pages.legal.privacy.children.title")}</h2>
			<p>{t("pages.legal.privacy.children.content", { age: String(legalInfo.minimumAge) })}</p>
		</section>

		<section>
			<h2>{t("pages.legal.privacy.changes.title")}</h2>
			<p>
				{t("pages.legal.privacy.changes.content")}<A href="/terms-of-service">{t("components.sidebar.termsOfService")}</A>.
			</p>
		</section>

		<section>
			<h2>{t("pages.legal.contact.title")}</h2>
			<p>{t("pages.legal.privacy.contact")}<a href={mail}>{legalInfo.contactEmail}</a>.</p>
		</section>
	</LegalLayout>;
}
