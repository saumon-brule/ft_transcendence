import type { Language } from "@flex/shared";

const common = {
	en: { footer: "This is an automated message, please do not reply.", privacy: "Privacy policy", validityBegin: "This link is only valid for ", validityDuration: "15 minutes", validityEnd: "." },
	fr: { footer: "Ceci est un message automatique, merci de ne pas y répondre.", privacy: "Politique de confidentialité", validityBegin: "Ce lien n'est valable que ", validityDuration: "15 minutes", validityEnd: "." },
	es: { footer: "Este es un mensaje automático, por favor no respondas.", privacy: "Política de privacidad", validityBegin: "Este enlace solo es válido durante ", validityDuration: "15 minutos", validityEnd: "." },
	ja: { footer: "このメールは自動送信です。返信しないでください。", privacy: "プライバシーポリシー", validityBegin: "このリンクの有効期限は", validityDuration: "15分間", validityEnd: "です。" },
} satisfies Record<Language, Record<string, string>>;

const templates = {
	"confirm-email": {
		en: {
			subject: "Confirm your email - Flex",
			headline: "Confirm your email address",
			greetingBegin: "Hey ",
			greetingEnd: ", welcome to Flex.",
			body: "Tap the button below to verify your email address and finish setting up your account.",
			button: "Confirm my email",
			ignore: "Didn't create an account? You can safely ignore this email - nothing will happen.",
		},
		fr: {
			subject: "Confirme ton adresse email - Flex",
			headline: "Confirme ton adresse email",
			greetingBegin: "Salut ",
			greetingEnd: ", bienvenue sur Flex.",
			body: "Clique sur le bouton ci-dessous pour vérifier ton adresse email et finir de créer ton compte.",
			button: "Confirmer mon email",
			ignore: "Tu n'as pas créé de compte ? Tu peux ignorer cet email, il ne se passera rien.",
		},
		es: {
			subject: "Confirma tu correo electrónico - Flex",
			headline: "Confirma tu dirección de correo",
			greetingBegin: "Hola ",
			greetingEnd: ", bienvenido a Flex.",
			body: "Pulsa el botón de abajo para verificar tu dirección de correo y terminar de crear tu cuenta.",
			button: "Confirmar mi correo",
			ignore: "¿No has creado una cuenta? Puedes ignorar este correo, no pasará nada.",
		},
		ja: {
			subject: "メールアドレスの確認 - Flex",
			headline: "メールアドレスを確認してください",
			greetingBegin: "こんにちは、",
			greetingEnd: "さん。Flex へようこそ。",
			body: "下のボタンを押してメールアドレスを確認し、アカウントの作成を完了してください。",
			button: "メールアドレスを確認する",
			ignore: "アカウントを作成した覚えがない場合は、このメールを無視してください。何も起こりません。",
		},
	},
	"reset-password": {
		en: {
			subject: "Reset your password - Flex",
			headline: "Reset your password",
			body: "Tap the button below to reset your password.",
			button: "Reset password",
			ignore: "Didn't ask for a password reset? You can ignore this email: your password stays the same.",
		},
		fr: {
			subject: "Réinitialise ton mot de passe - Flex",
			headline: "Réinitialise ton mot de passe",
			body: "Clique sur le bouton ci-dessous pour réinitialiser ton mot de passe.",
			button: "Réinitialiser le mot de passe",
			ignore: "Tu n'as pas demandé de réinitialisation ? Tu peux ignorer cet email : ton mot de passe ne change pas.",
		},
		es: {
			subject: "Restablece tu contraseña - Flex",
			headline: "Restablece tu contraseña",
			body: "Pulsa el botón de abajo para restablecer tu contraseña.",
			button: "Restablecer contraseña",
			ignore: "¿No has pedido restablecer tu contraseña? Puedes ignorar este correo: tu contraseña no cambia.",
		},
		ja: {
			subject: "パスワードの再設定 - Flex",
			headline: "パスワードを再設定してください",
			body: "下のボタンを押してパスワードを再設定してください。",
			button: "パスワードを再設定する",
			ignore: "パスワードの再設定を依頼していない場合は、このメールを無視してください。パスワードは変更されません。",
		},
	},
	"reset-email": {
		en: {
			subject: "Change your email - Flex",
			headline: "Set your new email",
			body: "Tap the button below to set your new email.",
			button: "Set email",
			ignore: "Didn't ask for this email change? You can ignore this email.",
		},
		fr: {
			subject: "Change ton adresse email - Flex",
			headline: "Valide ta nouvelle adresse email",
			body: "Clique sur le bouton ci-dessous pour utiliser cette nouvelle adresse email.",
			button: "Valider l'adresse",
			ignore: "Tu n'as pas demandé ce changement ? Tu peux ignorer cet email.",
		},
		es: {
			subject: "Cambia tu correo electrónico - Flex",
			headline: "Confirma tu nuevo correo",
			body: "Pulsa el botón de abajo para usar esta nueva dirección de correo.",
			button: "Confirmar correo",
			ignore: "¿No has pedido este cambio? Puedes ignorar este correo.",
		},
		ja: {
			subject: "メールアドレスの変更 - Flex",
			headline: "新しいメールアドレスを設定してください",
			body: "下のボタンを押して新しいメールアドレスを設定してください。",
			button: "メールアドレスを設定する",
			ignore: "この変更を依頼していない場合は、このメールを無視してください。",
		},
	},
} satisfies Record<string, Record<Language, Record<string, string>>>;

export type MailTemplate = keyof typeof templates;
export const MAIL_TEMPLATES = Object.keys(templates) as MailTemplate[];

export function mailTexts(template: MailTemplate, language: Language) {
	return { ...common[language], ...templates[template][language] };
}
