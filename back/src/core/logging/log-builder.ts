
export class LogBuilder {
	static auth = {
		registration: (email: string, userUUID?: string) => ({
			action: "AUTH_REGISTRATION",
			email,
			userUUID,
		}),
		registrationFailed: (email: string, reason: string) => ({
			action: "AUTH_REGISTRATION_FAILED",
			email,
			reason,
		}),
		login: (email: string, userUUID: string) => ({
			action: "AUTH_LOGIN",
			email,
			userUUID,
		}),
		loginFailed: (email: string, reason: string) => ({
			action: "AUTH_LOGIN_FAILED",
			email,
			reason,
		}),
		logout: (userUUID: string) => ({
			action: "AUTH_LOGOUT",
			userUUID,
		}),
		passwordChanged: (userUUID: string) => ({
			action: "PASSWORD_CHANGED",
			userUUID,
		}),
		passwordResetRequested: (email: string) => ({
			action: "PASSWORD_RESET_REQUESTED",
			email,
		}),
	};

	static mail = {
		send: (email: string[], template: string) => ({
			action: "SEND_EMAIL",
			email,
			template,
		}),
	};

	static session = {
		cleanupCompleted: (deletedCount: number) => ({
			action: "SESSIONS_CLEANUP_COMPLETED",
			deletedCount,
		}),
	};

	static token = {
		created: (purpose: string, userUUID?: string) => ({
			action: "TOKEN_CREATED",
			purpose,
			userUUID,
		}),
		validated: (purpose: string, userUUID?: string) => ({
			action: "TOKEN_VALIDATED",
			purpose,
			userUUID,
		}),
		validationFailed: (purpose: string, reason: string) => ({
			action: "TOKEN_VALIDATION_FAILED",
			purpose,
			reason,
		}),
		cleanupCompleted: (deletedCount: number) => ({
			action: "TOKENS_CLEANUP_COMPLETED",
			deletedCount,
		}),
	};

	static provider = {
		created: (providerUuid: string, ownerUuid: string) => ({
			action: "PROVIDER_CREATED",
			providerUuid,
			ownerUuid,
		}),
		apiKeyRejected: (reason: string, ip?: string) => ({
			action: "PROVIDER_API_KEY_REJECTED",
			reason,
			ip,
		}),
	};

	static user = {
		unverifiedCleaned: (deletedCount: number) => ({
			action: "UNVERIFIED_MEMBERS_CLEANUP",
			deletedCount,
		}),
	};

	static error = (action: string, message: string, details?: Record<string, unknown>) => ({
		action: `${action}_ERROR`,
		message,
		details,
	});
}
