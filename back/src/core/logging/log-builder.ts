
export class LogBuilder {
	static auth = {
		registration: (email: string, userId?: number) => ({
			action: "AUTH_REGISTRATION",
			email,
			userId,
		}),
		registrationFailed: (email: string, reason: string) => ({
			action: "AUTH_REGISTRATION_FAILED",
			email,
			reason,
		}),
		login: (email: string, userId: number) => ({
			action: "AUTH_LOGIN",
			email,
			userId,
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
		passwordChanged: (userId: number) => ({
			action: "PASSWORD_CHANGED",
			userId,
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
		created: (purpose: string, userId?: number) => ({
			action: "TOKEN_CREATED",
			purpose,
			userId,
		}),
		validated: (purpose: string, userId?: number) => ({
			action: "TOKEN_VALIDATED",
			purpose,
			userId,
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
