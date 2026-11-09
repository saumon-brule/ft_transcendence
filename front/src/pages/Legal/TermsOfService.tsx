import { A } from "@solidjs/router";
import LegalLayout from "./LegalLayout";
import { legalInfo } from "./legalInfo";

export default function TermsOfService() {
	const mail = `mailto:${legalInfo.contactEmail}`;

	return <LegalLayout title="Terms of Service">
		<p>
			These terms govern your use of {legalInfo.serviceName}, operated by <strong>{legalInfo.operator}</strong>.
			By creating an account or using the service, you accept them. If you do not agree, do not use {legalInfo.serviceName}.
		</p>

		<section>
			<h2>The service</h2>
			<p>
				Flex lets you listen to music hosted on <strong>providers</strong>: servers run by users, connected to their Flex account.
				Flex provides the accounts, the social features (friends, playlists, listening status) and the interface.
				Flex does not host, sell or distribute music itself.
			</p>
			<p>The service is free and provided as is. Features may change, be added or be removed at any time.</p>
		</section>

		<section>
			<h2>Your account</h2>
			<ul>
				<li>You must be at least {legalInfo.minimumAge} years old to create an account.</li>
				<li>The information you give must be accurate, and your email address must be yours.</li>
				<li>You are responsible for keeping your password and your provider keys secret, and for everything done with your account.</li>
				<li>Tell us at <a href={mail}>{legalInfo.contactEmail}</a> if you think your account has been compromised.</li>
			</ul>
		</section>

		<section>
			<h2>Providers and content</h2>
			<p>If you run a provider or add music to one:</p>
			<ul>
				<li>You must own the rights to the content you host and share, or be allowed to share it. Sharing music without the rights holders' permission is forbidden.</li>
				<li>You are the only one responsible for the content of your provider, for who you give access to, and for the personal data your provider processes.</li>
				<li>You keep all your rights on your content. Flex only displays the information your provider exposes, to the users you allow.</li>
			</ul>
			<p>
				If you join someone else's provider, its operator decides who can access it and can revoke your access.
				Flex does not check the content of providers. To report content that infringes your rights, write to <a href={mail}>{legalInfo.contactEmail}</a>:
				we can remove the provider from Flex.
			</p>
		</section>

		<section>
			<h2>Acceptable use</h2>
			<p>You agree not to:</p>
			<ul>
				<li>Harass, threaten or impersonate other users, or use offensive usernames, avatars or playlist names.</li>
				<li>Share illegal content, or content you do not have the right to share.</li>
				<li>Try to access accounts, providers or data that are not yours.</li>
				<li>Disrupt the service, overload it, or bypass its security or rate limits.</li>
				<li>Use bots or scripts to create accounts or scrape data.</li>
			</ul>
		</section>

		<section>
			<h2>Suspension and termination</h2>
			<p>
				You can stop using Flex at any time and ask for your account to be deleted. We may suspend or delete an account
				or a provider that breaks these terms, with notice when possible.
			</p>
		</section>

		<section>
			<h2>Open source</h2>
			<p>
				The code of Flex is open source and available on <a href={legalInfo.repositoryUrl}>GitHub</a>.
				Its license applies to the code; these terms apply to the service we run.
			</p>
		</section>

		<section>
			<h2>Liability</h2>
			<p>
				Flex is provided without any warranty of availability or fitness for a purpose. We are not responsible for content
				hosted on providers, for the availability of providers, or for the actions of their operators. To the extent permitted
				by law, we are not liable for indirect damages or loss of data resulting from the use of the service.
			</p>
		</section>

		<section>
			<h2>Privacy</h2>
			<p>How we handle your personal data is described in our <A href="/privacy-policy">Privacy Policy</A>.</p>
		</section>

		<section>
			<h2>Changes</h2>
			<p>
				We may update these terms. The date at the top of the page shows the latest version. If you keep using Flex
				after a change, you accept the new terms.
			</p>
		</section>

		<section>
			<h2>Governing law</h2>
			<p>These terms are governed by {legalInfo.governingLaw}. Disputes are handled by the competent French courts.</p>
		</section>

		<section>
			<h2>Contact</h2>
			<p>Questions about these terms: <a href={mail}>{legalInfo.contactEmail}</a>.</p>
		</section>
	</LegalLayout>;
}
