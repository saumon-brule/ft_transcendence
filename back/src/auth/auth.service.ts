import {
	ConflictException,
	Injectable,
	InternalServerErrorException,
} from "@nestjs/common";
import { UsersService } from "../users/users.service";
import { emailConfirmationPath, ftIntraAuthCallbackPath, ftIntraLinkCallbackPath, RegisterDto } from "@flex/shared";
import * as bcrypt from "bcrypt";
import { LoginDto } from "@flex/shared";
import { JwtService } from "@nestjs/jwt";
import { SessionsService } from "../sessions/sessions.service";
import { createJwtPayload } from "@flex/shared";
import { AppUnauthorizedException } from "../core/error/unauthorized";
import { MailService } from "../core/mail/mail.service";
import { User } from "../generated/prisma/client";
import { AppForbiddenException } from "../core/error/forbidden";
import { TokensService } from "../tokens/tokens.service";
import { AppConfigService } from "../config/config.service";
import z from "zod";
import { env } from "../core/env";
import { randomUUID, UUID } from "crypto";
import { WinstonLoggerService } from "../core/logging/logger.service";
import { LogBuilder } from "../core/logging/log-builder";

const TokenResponseSchema = z.object({
	access_token: z.string(),
});

const Me42ResponseSchema = z.object({
	login: z.string(),
	email: z.string(),
});

@Injectable()
export class AuthService {
	constructor(
		private readonly users: UsersService,
		private readonly sessions: SessionsService,
		private readonly jwtService: JwtService,
		private readonly mailService: MailService,
		private readonly tokensService: TokensService,
		private readonly appConfig: AppConfigService,
		private readonly logger: WinstonLoggerService,
	) {}

	public async register(
		dto: RegisterDto,
		userAgent: string | undefined,
		ipAddress: string | undefined,
	) {
		const existing = await this.users.getByEmail(dto.email);

		if (existing) {
			this.logger.warn(LogBuilder.auth.registrationFailed(dto.email, "Email already exists"));
			throw new ConflictException("Email already used");
		}

		const insertedUser = await this.users.createFromRegister(
			dto.email,
			dto.password,
			dto.displayName,
		);

		if (!insertedUser) {
			this.logger.error(LogBuilder.error("AUTH_REGISTRATION", "Failed to create user"));
			throw new InternalServerErrorException("An error occured while creating the user");
		}

		this.logger.log(LogBuilder.auth.registration(dto.email, insertedUser.id));

		await this.sendEmailValidation(insertedUser);

		return {
			accessToken: await this.generateAccessToken(insertedUser.id),
			refreshToken: await this.generateRefreshToken(
				insertedUser.id,
				userAgent,
				ipAddress,
			),
		};
	}

	public async login(
		dto: LoginDto,
		userAgent: string | undefined,
		ipAddress: string | undefined,
	) {
		const existing = await this.users.getByEmail(dto.email);

		if (!existing) {
			throw new AppUnauthorizedException(
				"INVALID_CREDENTIALS",
				"Invalid credentials",
			);
		}

		if (!existing.password) {
			this.logger.warn(LogBuilder.auth.loginFailed(dto.email, "Intra-only account"));
			throw new AppUnauthorizedException("INTRA_ONLY_ACCOUNT", "This email is related to an intra login only");
		}

		const isValidPassword = await bcrypt.compare(
			dto.password,
			existing.password,
		);

		if (!isValidPassword) {
			this.logger.warn(LogBuilder.auth.loginFailed(dto.email, "Invalid password"));
			throw new AppUnauthorizedException("INVALID_CREDENTIALS", "Invalid credentials");
		}

		this.logger.log(LogBuilder.auth.login(dto.email, existing.id));

		return {
			accessToken: await this.generateAccessToken(existing.id),
			refreshToken: await this.generateRefreshToken(
				existing.id,
				userAgent,
				ipAddress,
			),
		};
	}

	public async refresh(
		userId: number,
		jti: UUID | undefined,
		userAgent: string | undefined,
		ipAddress: string | undefined,
	) {
		if (!jti) throw new AppUnauthorizedException("INVALID_REFRESH_TOKEN", "Invalid refresh token");

		const validSession = await this.sessions.isValidSession(userId, jti);

		if (validSession) {
			await this.sessions.removeSession(validSession.id);

			return {
				accessToken: await this.generateAccessToken(userId),
				refreshToken: await this.generateRefreshToken(
					userId,
					userAgent,
					ipAddress,
				),
			};
		}

		throw new AppUnauthorizedException("INVALID_REFRESH_TOKEN", "Invalid refresh token");
	}

	private async generateAccessToken(userId: number) {
		const user = await this.users.getById(userId);
		return this.jwtService.signAsync(
			createJwtPayload(userId, user.emailValidated),
			{
				secret: env.JWT_SECRET,
				expiresIn: "15m",
			},
		);
	}

	private async generateRefreshToken(
		userId: number,
		userAgent: string | undefined,
		ipAddress: string | undefined,
	) {
		const jti = randomUUID();
		const token = await this.jwtService.signAsync(
			{ sub: userId, jti },
			{ secret: env.JWT_REFRESH_SECRET, expiresIn: "7d" },
		);
		const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

		if (
			!(await this.sessions.create(
				userId,
				jti,
				expiresAt,
				userAgent ?? "",
				ipAddress ?? "unknown",
			))
		) {
			throw new InternalServerErrorException("An error occured while creating the session");
		}

		return token;
	}

	private async sendEmailValidation(user: User) {
		if (user.emailValidated) {
			throw new AppForbiddenException("FORBIDDEN", "your email is already validated");
		}

		await this.mailService.sendEmail([user.email], "Confirm your email - 42's Foyer", "confirm-email", {
			username: user.displayName,
			token: await this.tokensService.createConfirmEmailToken(user.id),
			baseFrontUrl: env.BASE_FRONT_URL,
			emailConfirmationPath,
			year: new Date().getFullYear(),
		});
	}

	public async confirmEmail(token: string) {
		const payload = await this.tokensService.isValidToken(
			token,
			"EMAIL_VERIFICATION",
		);

		await this.users.verifyEmail(payload.userId);
	}

	public async askNewConfirmationEmail(userId: number) {
		const user = await this.users.getById(userId);
		await this.sendEmailValidation(user);
	}

	private async sendResetPasswordEmail(user: User) {
		await this.mailService.sendEmail(
			[user.email],
			"Reset your password - 42's Foyer",
			"reset-password",
			{
				token: await this.tokensService.createResetPasswordToken(user.id),
				baseFrontUrl: env.BASE_FRONT_URL,
				year: new Date().getFullYear(),
			},
		);
	}

	public async requestPasswordReset(email: string) {
		const user = await this.users.getByEmail(email);

		// Pas d'erreur pour eviter que quelqu'un puisse sonder les email en db
		if (user) {
			await this.sendResetPasswordEmail(user);
		}
		this.logger.log(LogBuilder.auth.passwordResetRequested(email));
	}

	public async resetPassword(token: string, password: string) {
		const payload = await this.tokensService.isValidToken(
			token,
			"PASSWORD_RESET",
		);

		await this.users.setPassword(payload.userId, password);
		this.logger.log(LogBuilder.auth.passwordChanged(payload.userId));
	}

	public async changePassword(
		userId: number,
		oldPassword: string,
		newPassword: string,
	) {
		const existing = await this.users.getById(userId);
		if (!existing) {
			throw new AppForbiddenException(
				"FORBIDDEN",
				"You shouldn't have an error unless your account have been deleted or something like that",
			);
		}

		if (!existing.password) {
			throw new AppForbiddenException(
				"FORBIDDEN",
				"You shouldn't be able to call this route with an intra only account",
			);
		}

		if (!(await bcrypt.compare(oldPassword, existing.password))) {
			// Seule erreur a gerer coté front car les autres ne devraient pas pouvoir arriver
			throw new AppForbiddenException("FORBIDDEN", "Invalid password");
		}

		await this.users.setPassword(userId, newPassword);
		this.logger.log(LogBuilder.auth.passwordChanged(userId));
	}

	public async logout(userId: number, jti: UUID | undefined) {
		if (!jti) return;

		const validSession = await this.sessions.isValidSession(userId, jti);

		if (validSession) {
			await this.sessions.removeSession(validSession.id);
			this.logger.log(LogBuilder.auth.logout(userId));
		}
	}

	private async sendChangeEmail(user: User, newEmail: string) {
		await this.mailService.sendEmail(
			[user.email],
			"Change your email - 42's Foyer",
			"reset-email",
			{
				token: await this.tokensService.createResetEmailToken(
					user.id,
					newEmail,
				),
				baseFrontUrl: env.BASE_FRONT_URL,
				year: new Date().getFullYear(),
			},
		);
	}

	public async requestEmailReset(
		userId: number,
		password: string,
		newEmail: string,
	) {
		const user = await this.users.getById(userId);

		if (!user) {
			throw new AppForbiddenException("FORBIDDEN", "This shouldn't happen");
		}

		if (!user.password || !(await bcrypt.compare(password, user.password))) {
			throw new AppForbiddenException("FORBIDDEN", "Invalid password");
		}

		await this.sendChangeEmail(user, newEmail);
	}

	public async resetEmail(token: string) {
		const payload = await this.tokensService.isValidToken(token, "EMAIL_RESET");
		await this.users.setEmail(payload.userId, payload.data.newEmail);
	}

	public async get42LoginUrl() {
		const api42_client_uid = await this.appConfig.get("42api-uid");

		if (!api42_client_uid) {
			throw new InternalServerErrorException("API 42 credentials are not set");
		}

		const state = await this.tokensService.create42AuthStateToken();

		const url = `https://api.intra.42.fr/oauth/authorize?client_id=${api42_client_uid}&redirect_uri=${env.BASE_FRONT_URL}${ftIntraAuthCallbackPath}&response_type=code&scope=public&state=${state}`;
		return url;
	}

	public async get42LinkUrl(userId: number) {
		const user = await this.users.getById(userId);

		if (user && user.login) {
			throw new AppForbiddenException("FORBIDDEN", "You already have a linked login");
		}

		const api42_client_uid = await this.appConfig.get("42api-uid");

		if (!api42_client_uid) {
			throw new InternalServerErrorException("API 42 credentials are not set");
		}

		const state = await this.tokensService.create42LinkStateToken(userId);

		const url = `https://api.intra.42.fr/oauth/authorize?client_id=${api42_client_uid}&redirect_uri=${env.BASE_FRONT_URL}${ftIntraLinkCallbackPath}&response_type=code&scope=public&state=${state}`;
		return url;
	}

	public async auth42(
		code: string,
		state: string,
		userAgent: string | undefined,
		ipAddress: string | undefined,
	) {
		await this.tokensService.isValidToken(state, "STATE_42AUTH");

		const userData = await this.get42UserInfo(code, env.BASE_FRONT_URL + ftIntraAuthCallbackPath);

		if (!userData || !userData.login) {
			throw new AppUnauthorizedException("UNAUTHORIZED", "Failed to retrieve user data from 42");
		}

		let user = await this.users.getByLogin(userData.login);

		if (!user) {
			user = await this.users.createFromIntra(
				userData.email,
				userData.login,
			);
		}

		if (!user) {
			throw new InternalServerErrorException("An error occured while creating the user");
		}

		if (!user?.login) {
			await this.users.setLogin(user.id, userData.login);
		}

		return {
			accessToken: await this.generateAccessToken(user.id),
			refreshToken: await this.generateRefreshToken(
				user.id,
				userAgent ?? "",
				ipAddress ?? "unknown",
			),
		};
	}

	public async link42(
		userId: number,
		code: string,
		state: string,
	) {
		const state_user = await this.tokensService.isValidToken(state, "STATE_42LINK");

		if (state_user.userId !== userId) {
			throw new AppForbiddenException("FORBIDDEN", "This is not your token");
		}

		const userData = await this.get42UserInfo(code, env.BASE_FRONT_URL + ftIntraLinkCallbackPath);

		const existingUser = await this.users.getByLogin(userData.login);

		if (existingUser) {
			throw new ConflictException("This login is already linked to an account");
		}

		await this.users.setLogin(userId, userData.login);
	}

	private async get42UserInfo(code: string, redirectUri: string) {
		const api42_client_uid = await this.appConfig.get("42api-uid");
		const api42_client_secret = await this.appConfig.get("42api-secret");

		if (!api42_client_uid || !api42_client_secret) {
			throw new InternalServerErrorException("API 42 credentials are not set");
		}

		try {
			const tokenResponse = await fetch("https://api.intra.42.fr/oauth/token", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					grant_type: "authorization_code",
					client_id: api42_client_uid,
					client_secret: api42_client_secret,
					code,
					redirect_uri: redirectUri,
				}),
			});

			const tokenData = TokenResponseSchema.parse(await tokenResponse.json());

			if (!tokenData.access_token) {
				throw new AppUnauthorizedException("UNAUTHORIZED", "Failed to authenticate with 42");
			}

			const userResponse = await fetch("https://api.intra.42.fr/v2/me", {
				headers: { Authorization: `Bearer ${tokenData.access_token}` },
			});
			const userData = Me42ResponseSchema.parse(await userResponse.json());

			if (!userData) {
				throw new AppUnauthorizedException("UNAUTHORIZED", "Failed to retrieve user data from 42");
			}
			return userData;

		} catch (_e) {
			throw new InternalServerErrorException("An error occured while fetching data from 42's api");
		}
	}

}
