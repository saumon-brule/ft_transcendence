import { RawDictionary } from "../context";

export default {
	pages: {
		login: {
			error: {
				intraOnly: {
					begin: "FR: This account is only accessible with the ",
					link: "FR: 42's Intra login",
					end: "",
				},
				invalidCredentials: "FR: Invalid credential combination",
			},
		},
		ftAuthCallback: {
			mainErrorMessage: "Une erreur imprévue s'est produite :/",
			subErrorMessage: "Veuillez réessayer plus tard.",
			mainRefusedMessage: "Vous avez refusé ToT",
			subRefusedMessage: "Pas cool ...",
		},
		promptVerifyEmail: {
			title: "Vérifie ton email",
			mainContent: "On t'a envoyé un email à",
			description: "Clique sur le lien dans l'email pour activer ton compte.",
			spamMention: "Pense à vérifier tes spams si tu ne vois rien.",
			resendText: "Tu n'as rien reçu ?",
			resendLink: "Renvoyer l'email",
			logout: "Utiliser un autre compte",
		},
		confirmEmail: {
			title: "Vérifie ton email",
			loadingMessage: "On prépare tout, attends juste une petite seconde...",
			successMessage: "Tout est bon, ton compte est prêt !",
			successLink: "Aller à la page d'accueil",
			errorMessage: "Mmh... On a rencontré un problème :(",
			errorLink: "Retourner en lieu sûr",
		},
		requestPasswordReset: {
			title: "Réinitialiser votre mot de passe",
			description: "Entrez votre addresse email pour réinitialiser votre mot de passe.",
			rateLimit: "Vous pouvez renvoyer une addresse email dans {{time}}",
			success: "Si un compte est associé à cette adresse email, vous recevrez un lien pour réinitialiser votre mot de passe",
			input: {
				placeholder: "Adresse email",
				button: "Réinitialiser",
			},
		},
		resetPassword: {
			title: "Modifier votre mot de passe",
			success: "Votre mot de passe a été modifié avec succès",
			error: "Ce lien n'est plus valide",
			invalidToken: "Votre lien a expiré",
			submitButton: "Modifier le mot de passe",
			inputs: {
				newPassword: "Nouveau mot de passe",
				confirmNewPassword: "Confirmer le nouveau mot de passe",
			},
		},
		settings: {
			edit: "modifier",
			confirm: "confirmer",
			cancel: "annuler",
			account: {
				username: {
					popUp: {
						title: "Modifier votre pseudo",
						placeholder: "Nouveau pseudo",
						success: "Votre pseudo a bien été modifié",
						failure: "Votre pseudo n'a pas pu être modifié : {{reason}}",
						failureNoReason: "Votre pseudo n'a pas pu être modifié",
					},
				},
				password: {
					popUp: {
						title: "Modifier votre mot de passe",
						placeholder: {
							old: "Ancien mot de passe",
							new: "Nouveau mot de passe",
							confirm: "Confirmer mot de passe",
						},
						success: "Votre mot de passe a bien été modifié",
						failure: "Votre mot de passe n'a pas pu être modifié : {{reason}}",
						failureNoReason: "Votre mot de passe n'a pas pu être modifié",
					},
				},
				email: {
					popUp: {
						title: "Modifier votre email",
						placeholder: {
							password: "Mot de pass",
							newEmail: "Nouvel email",
						},
						success: "Votre addresse email a bien été modifiée, vous avez reçu un mail de vérification",
						failure: "Votre addresse email n'a pas pu être modifié : {{reason}}",
						failureNoReason: "Votre addresse email n'a pas pu être modifié",
					},
				},
			},
		},
	},
	errors: {
		rateLimit: "Euh... Bro tu vas trop vite là !",
		unavailableFtApi: "We are not currently able to reach 42's API",
		unknownFallback: "Une erreur s'est produite, réessayez plus tard",
		input: {
			text: {
				tooShort: "FR: Input too short",
				tooLong: "FR: Input too long",
				patternMismatch: "FR: Invalid input format",
				text: {
					valueMissing: "Ce champ est requis",
					typeMismatch: "FR: Une valeur valide est requise pour ce champ",
				},
				email: {
					valueMissing: "FR: Please enter an email",
					typeMismatch: "FR: Please enter a valid email",
				},
				password: {
					valueMissing: "FR: Please enter a password",
					typeMismatch: "FR: Please enter a valid password",
					confirmationMismatch: "FR: Password and confirmation password are different",
				},
				tel: {
					valueMissing: "FR: Please enter a phone number",
					typeMismatch: "FR: Please enter a valid phone number",
				},
				url: {
					valueMissing: "FR: Please enter a url",
					typeMismatch: "FR: Please enter a valid url",
				},
				search: {
					valueMissing: "FR: Please enter a research",
					typeMismatch: "FR: Please enter a valid research",
				},
			},
		},
		auth: {
			invalidPassword: "FR: Password is incorrect",
		},
		register: {
			conflictingEmail: "FR: This email is already taken",
		},
	},
} as const satisfies RawDictionary;
