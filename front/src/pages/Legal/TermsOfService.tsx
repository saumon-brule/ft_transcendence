import { A } from "@solidjs/router";
import LegalLayout from "./LegalLayout";
import { legalInfo } from "./legalInfo";
import { useTranslation } from "~/i18n/context";

export default function TermsOfService() {
	const { t } = useTranslation();
	const mail = `mailto:${legalInfo.contactEmail}`;
	const service = { service: legalInfo.serviceName };

	return <LegalLayout title={t("pages.legal.terms.title")}>
		<p>
			{t("pages.legal.terms.intro.begin", service)}<strong>{legalInfo.operator}</strong>{t("pages.legal.terms.intro.end", service)}
		</p>

		<section>
			<h2>{t("pages.legal.terms.service.title")}</h2>
			<p>
				{t("pages.legal.terms.service.p1.begin")}<strong>{t("pages.legal.terms.service.p1.providers")}</strong>{t("pages.legal.terms.service.p1.end")}
			</p>
			<p>{t("pages.legal.terms.service.p2")}</p>
		</section>

		<section>
			<h2>{t("pages.legal.terms.account.title")}</h2>
			<ul>
				<li>{t("pages.legal.terms.account.age", { age: String(legalInfo.minimumAge) })}</li>
				<li>{t("pages.legal.terms.account.accurate")}</li>
				<li>{t("pages.legal.terms.account.secrets")}</li>
				<li>{t("pages.legal.terms.account.compromised.begin")}<a href={mail}>{legalInfo.contactEmail}</a>{t("pages.legal.terms.account.compromised.end")}</li>
			</ul>
		</section>

		<section>
			<h2>{t("pages.legal.terms.providers.title")}</h2>
			<p>{t("pages.legal.terms.providers.intro")}</p>
			<ul>
				<li>{t("pages.legal.terms.providers.rights")}</li>
				<li>{t("pages.legal.terms.providers.responsible")}</li>
				<li>{t("pages.legal.terms.providers.ownership")}</li>
			</ul>
			<p>
				{t("pages.legal.terms.providers.report.begin")}<a href={mail}>{legalInfo.contactEmail}</a>{t("pages.legal.terms.providers.report.end")}
			</p>
		</section>

		<section>
			<h2>{t("pages.legal.terms.acceptableUse.title")}</h2>
			<p>{t("pages.legal.terms.acceptableUse.intro")}</p>
			<ul>
				<li>{t("pages.legal.terms.acceptableUse.harass")}</li>
				<li>{t("pages.legal.terms.acceptableUse.illegal")}</li>
				<li>{t("pages.legal.terms.acceptableUse.access")}</li>
				<li>{t("pages.legal.terms.acceptableUse.disrupt")}</li>
				<li>{t("pages.legal.terms.acceptableUse.bots")}</li>
			</ul>
		</section>

		<section>
			<h2>{t("pages.legal.terms.termination.title")}</h2>
			<p>{t("pages.legal.terms.termination.content")}</p>
		</section>

		<section>
			<h2>{t("pages.legal.terms.openSource.title")}</h2>
			<p>
				{t("pages.legal.terms.openSource.begin")}<a href={legalInfo.repositoryUrl}>GitHub</a>{t("pages.legal.terms.openSource.end")}
			</p>
		</section>

		<section>
			<h2>{t("pages.legal.terms.liability.title")}</h2>
			<p>{t("pages.legal.terms.liability.content")}</p>
		</section>

		<section>
			<h2>{t("pages.legal.terms.privacy.title")}</h2>
			<p>{t("pages.legal.terms.privacy.begin")}<A href="/privacy-policy">{t("components.sidebar.privacyPolicy")}</A>{t("pages.legal.terms.privacy.end")}</p>
		</section>

		<section>
			<h2>{t("pages.legal.terms.changes.title")}</h2>
			<p>{t("pages.legal.terms.changes.content")}</p>
		</section>

		<section>
			<h2>{t("pages.legal.terms.governingLaw.title")}</h2>
			<p>{t("pages.legal.terms.governingLaw.content")}</p>
		</section>

		<section>
			<h2>{t("pages.legal.contact.title")}</h2>
			<p>{t("pages.legal.terms.contact")}<a href={mail}>{legalInfo.contactEmail}</a>.</p>
		</section>
	</LegalLayout>;
}
