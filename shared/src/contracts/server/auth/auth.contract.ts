import { initContract } from "@ts-rest/core";
import { authResponseSchema } from "./schemas/auth-response.schema";
import { loginSchema } from "./schemas/login.schema";
import { registerSchema } from "./schemas/register.schema";
import { confirmEmailSchema } from "./schemas/confirm-email.schema";
import { changePasswordSchema, requestPasswordResetSchema, resetPasswordSchema } from "./schemas/password.schema";
import { requestEmailResetSchema, resetEmailSchema } from "./schemas/email.schema";
import { auth42Schema, auth42UrlSchema } from "./schemas/42login.schema";
import { commonError409Schema, serverAuthError401Schema, serverError403Schema } from "../../../errors/error-schemas";
import z from "zod";

const c = initContract();

export const authContract = c.router(
	{
		register: {
			method: "POST",
			path: "/register",
			body: registerSchema,
			responses: {
				200: authResponseSchema,
				409: commonError409Schema,
				401: z.never(),
				403: z.never(),
			},
		},
		login: {
			method: "POST",
			path: "/login",
			body: loginSchema,
			responses: {
				200: authResponseSchema,
				401: serverAuthError401Schema,
				403: z.never(),
			},
		},
		logout: {
			method: "POST",
			path: "/logout",
			body: null,
			responses: {
				204: null,
				403: z.never(),
			},
		},
		refresh: {
			method: "POST",
			path: "/refresh",
			body: null,
			responses: {
				200: authResponseSchema,
				403: z.never(),
			},
		},
		confirmEmail: {
			method: "POST",
			path: "/confirm-email",
			body: confirmEmailSchema,
			responses: {
				204: null,
				403: z.never(),
			},
		},
		askNewConfirmationEmail: {
			method: "POST",
			path: "/new-confirm-email",
			body: null,
			responses: { 204: null },
		},
		changePassword: {
			method: "PATCH",
			path: "/password",
			body: changePasswordSchema,
			responses: { 204: null },
		},
		requestPasswordReset: {
			method: "POST",
			path: "/password/request-reset",
			body: requestPasswordResetSchema,
			responses: { 204: null },
		},
		resetPassword: {
			method: "POST",
			path: "/password/reset",
			body: resetPasswordSchema,
			responses: { 204: null },
		},
		requestEmailReset: {
			method: "POST",
			path: "/email/request-reset",
			body: requestEmailResetSchema,
			responses: { 204: null },
		},
		resetEmail: {
			method: "POST",
			path: "/email/reset",
			body: resetEmailSchema,
			responses: { 204: null },
		},
		redirectLogin42url: {
			method: "GET",
			path: "/42",
			responses: {
				302: null,
				401: z.never(),
			},
		},
		getLogin42url: {
			method: "GET",
			path: "/42/login-url",
			responses: {
				200: auth42UrlSchema,
				401: z.never(),
			},
		},
		getLink42url: {
			method: "GET",
			path: "/42/link-url",
			responses: {
				200: auth42UrlSchema,
				401: z.never(),
			},
		},
		auth42: {
			method: "POST",
			path: "/42/auth",
			body: auth42Schema,
			responses: {
				200: authResponseSchema,
				403: z.never(),
				409: commonError409Schema,
			},
		},
		link42: {
			method: "POST",
			path: "/42/link",
			body: auth42Schema,
			responses: {
				204: null,
				409: commonError409Schema,
			},
		},
		unlink42: {
			method: "DELETE",
			path: "/42/link",
			responses: {
				204: null,
				403: serverError403Schema,
				409: commonError409Schema,
			},
		},
	},
	{ pathPrefix: "/auth" },
);
