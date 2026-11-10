import { A } from "@solidjs/router";
import LegalLayout from "./LegalLayout";
import { legalInfo } from "./legalInfo";

export default function PrivacyPolicy() {
	const mail = `mailto:${legalInfo.contactEmail}`;

	return <LegalLayout title="Privacy Policy">
		<p>
			This policy explains what personal data {legalInfo.serviceName} collects, why, and what you can do about it.
			{" "}{legalInfo.serviceName} is operated by <strong>{legalInfo.operator}</strong>, which is the data controller
			for the data processed by the {legalInfo.serviceName} servers.
		</p>

		<section>
			<h2>What Flex is</h2>
			<p>
				Flex hosts your account and the interface you use to listen to music. The music itself is not stored by Flex:
				it lives on <strong>providers</strong>, servers that users install and run themselves. When you listen to a track,
				your browser fetches it directly from the provider that hosts it.
			</p>
		</section>

		<section>
			<h2>Data we collect</h2>
			<h3>Account</h3>
			<ul>
				<li>Your email address and username.</li>
				<li>Your password, stored only as a hash. We never store it in clear text.</li>
				<li>Your 42 Intra identifier, if you sign in with or link a 42 account.</li>
				<li>Your avatar, if you upload one, and your preferred language.</li>
			</ul>
			<h3>Activity on Flex</h3>
			<ul>
				<li>Your friends and friend requests.</li>
				<li>Your playlists and the tracks (title, artist, duration) they contain.</li>
				<li>The providers you own, the ones you joined and your access requests to providers.</li>
				<li>The track you are currently listening to, shown to your friends unless you make it private in your settings.</li>
			</ul>
			<h3>Sessions and security</h3>
			<ul>
				<li>For each active session: its creation and expiry date, your IP address and your browser's user agent.</li>
				<li>Single-use tokens for email verification, email change, password reset and 42 sign-in.</li>
			</ul>
		</section>

		<section>
			<h2>Why we use it</h2>
			<ul>
				<li><strong>Providing the service</strong> (performance of the contract): creating your account, signing you in, showing your library, playlists, friends and providers.</li>
				<li><strong>Security</strong> (legitimate interest): keeping your sessions safe, letting you see and revoke them, preventing abuse.</li>
				<li><strong>Emails</strong> (performance of the contract): verifying your address and resetting your password. We do not send marketing emails.</li>
			</ul>
			<p>We do not sell your data, show ads, or use your data for profiling.</p>
		</section>

		<section>
			<h2>Cookies and local storage</h2>
			<p>Flex only uses what is strictly necessary to work, so no consent banner is needed:</p>
			<ul>
				<li><code>refresh_token</code>: an HTTP-only cookie that keeps you signed in. It expires after 7 days or when you log out.</li>
				<li>Your browser's local storage keeps a few preferences, such as your playback position.</li>
			</ul>
			<p>There are no analytics or advertising trackers.</p>
		</section>

		<section>
			<h2>Who can see your data</h2>
			<ul>
				<li><strong>Other users</strong> can see your username, avatar, public playlists, the providers you display publicly and, unless you hide it, what you are listening to.</li>
				<li><strong>Provider operators</strong>: when you join or use a provider, its operator knows your Flex account identifier and receives your requests (including your IP address) when you stream from it. Each provider is run by a third party who is responsible for the data it processes.</li>
				<li><strong>42</strong>, if you use the 42 Intra sign-in. Its own privacy policy applies.</li>
				<li><strong>Our email provider</strong>, which receives your email address to deliver our messages.</li>
				<li><strong>Our host</strong>: {legalInfo.hostingLocation}.</li>
			</ul>
		</section>

		<section>
			<h2>How long we keep it</h2>
			<ul>
				<li>Account data is kept as long as your account exists, and deleted when the account is deleted.</li>
				<li>Sessions are kept until they expire (7 days) or until you log out.</li>
				<li>Single-use tokens are kept until they are used or expire.</li>
			</ul>
		</section>

		<section>
			<h2>Your rights</h2>
			<p>
				Under the GDPR you can access, correct, delete or export your data, object to or restrict its processing.
				You can change most of your information directly from your settings. For anything else, including deleting
				your account, write to <a href={mail}>{legalInfo.contactEmail}</a>.
			</p>
			<p>
				If you think we do not respect your rights, you can file a complaint with the CNIL (<a href="https://www.cnil.fr">cnil.fr</a>)
				or your local data protection authority.
			</p>
		</section>

		<section>
			<h2>Security</h2>
			<p>
				All traffic is encrypted with HTTPS, passwords are hashed, and the database is only reachable from inside our infrastructure.
				No system is perfectly secure, but we will inform you if a breach affects your data.
			</p>
		</section>

		<section>
			<h2>Children</h2>
			<p>Flex is not intended for children under {legalInfo.minimumAge}.</p>
		</section>

		<section>
			<h2>Changes</h2>
			<p>
				We may update this policy. The date at the top of the page shows the latest version, and important changes will be
				announced on Flex. See also our <A href="/terms-of-service">Terms of Service</A>.
			</p>
		</section>

		<section>
			<h2>Contact</h2>
			<p>Questions about this policy: <a href={mail}>{legalInfo.contactEmail}</a>.</p>
		</section>
	</LegalLayout>;
}
