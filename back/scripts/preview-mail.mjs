// Render mail templates to static HTML for quick preview.
// Usage: node scripts/preview-mail.mjs [--watch]
// Output: back/.mail-preview/<template>.html

import { createRequire } from "node:module";
import { readdirSync, readFileSync, writeFileSync, mkdirSync, watch } from "node:fs";
import { join, basename, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const Handlebars = require(
	require.resolve("handlebars", { paths: [require.resolve("@nestjs-modules/mailer")] }),
);

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const templatesDir = join(root, "src/core/mail/templates");
const outDir = join(root, ".mail-preview");

const context = {
	baseFrontUrl: "http://localhost:3000",
	emailConfirmationPath: "/auth/confirm-email",
	token: "preview-token-123",
	username: "liam",
	name: "liam",
	year: new Date().getFullYear(),
};

function render() {
	mkdirSync(outDir, { recursive: true });
	for (const file of readdirSync(templatesDir).filter((f) => f.endsWith(".hbs"))) {
		const name = basename(file, ".hbs");
		try {
			const tpl = Handlebars.compile(readFileSync(join(templatesDir, file), "utf8"), {
				strict: true,
			});
			writeFileSync(join(outDir, `${name}.html`), tpl(context));
			console.log(`✓ ${name} → .mail-preview/${name}.html`);
		} catch (e) {
			console.error(`✗ ${name}: ${e.message}`);
		}
	}
}

render();
if (process.argv.includes("--watch")) {
	console.log("Watching templates…");
	watch(templatesDir, () => render());
}
