import {
	ConflictException,
	Injectable,
	InternalServerErrorException,
} from "@nestjs/common";
import { UsersService } from "../users/users.service";
import { emailConfirmationPath, ftIntraAuthCallbackPath, RegisterDto } from "@flex/shared";
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
		const existingEmail = await this.users.getByEmail(dto.email);

		if (existingEmail) {
			this.logger.warn(LogBuilder.auth.registrationFailed(dto.email, "Email already exists"));
			throw new ConflictException("Email already used");
		}

		const insertedUser = await this.users.createFromRegister(
			dto.email,
			dto.password,
			dto.username,
		);

		if (!insertedUser) {
			this.logger.error(LogBuilder.error("AUTH_REGISTRATION", "Failed to create user"));
			throw new InternalServerErrorException("An error occured while creating the user");
		}

		this.logger.log(LogBuilder.auth.registration(dto.email, insertedUser.id));

		await this.sendEmailValidation(insertedUser);

		return {
			accessToken: await this.generateAccessToken(insertedUser.uuid, insertedUser.emailValidated),
			refreshToken: await this.generateRefreshToken(
				insertedUser.uuid,
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
			accessToken: await this.generateAccessToken(existing.uuid, existing.emailValidated),
			refreshToken: await this.generateRefreshToken(
				existing.uuid,
				userAgent,
				ipAddress,
			),
		};
	}

	public async refresh(
		userUUID: string,
		jti: UUID | undefined,
		userAgent: string | undefined,
		ipAddress: string | undefined,
	) {
		if (!jti) throw new AppUnauthorizedException("INVALID_REFRESH_TOKEN", "Invalid refresh token");

		const validSession = await this.sessions.isValidSession(userUUID, jti);

		if (validSession) {
			await this.sessions.removeSession(validSession.id);

			return {
				accessToken: await this.generateAccessTokenUUID(userUUID),
				refreshToken: await this.generateRefreshToken(
					userUUID,
					userAgent,
					ipAddress,
				),
			};
		}

		throw new AppUnauthorizedException("INVALID_REFRESH_TOKEN", "Invalid refresh token");
	}

	private async generateAccessToken(userUUID: string, emailValidated: boolean) {
		return this.jwtService.signAsync(
			createJwtPayload(userUUID, emailValidated),
			{
				secret: env.JWT_SECRET,
				expiresIn: "15m",
			},
		);
	}

	private async generateAccessTokenId(userId: number) {
		const user = await this.users.getById(userId);
		return this.jwtService.signAsync(
			createJwtPayload(user.uuid, user.emailValidated),
			{
				secret: env.JWT_SECRET,
				expiresIn: "15m",
			},
		);
	}

	private async generateAccessTokenUUID(userUUID: string) {
		const user = await this.users.getByUUID(userUUID);
		return this.jwtService.signAsync(
			createJwtPayload(userUUID, user.emailValidated),
			{
				secret: env.JWT_SECRET,
				expiresIn: "15m",
			},
		);
	}

	private async generateRefreshToken(
		userUUID: string,
		userAgent: string | undefined,
		ipAddress: string | undefined,
	) {
		const jti = randomUUID();
		const token = await this.jwtService.signAsync(
			{ sub: userUUID, jti },
			{ secret: env.JWT_REFRESH_SECRET, expiresIn: "7d" },
		);
		const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

		if (
			!(await this.sessions.create(
				userUUID,
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

		await this.mailService.sendEmail([user.email], "Confirm your email - Flex", "confirm-email", {
			username: user.username,
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

	public async askNewConfirmationEmail(userUUID: string) {
		const user = await this.users.getByUUID(userUUID);
		await this.sendEmailValidation(user);
	}

	private async sendResetPasswordEmail(user: User) {
		await this.mailService.sendEmail(
			[user.email],
			"Reset your password - Flex",
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
		userUUID: string,
		oldPassword: string,
		newPassword: string,
	) {
		const existing = await this.users.getByUUID(userUUID);
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
			throw new AppForbiddenException("INVALID_PASSWORD", "Invalid password");
		}

		await this.users.setPassword(existing.id, newPassword);
		this.logger.log(LogBuilder.auth.passwordChanged(existing.id));
	}

	public async logout(userUUID: string, jti: UUID | undefined) {
		if (!jti) return;

		const validSession = await this.sessions.isValidSession(userUUID, jti);

		if (validSession) {
			await this.sessions.removeSession(validSession.id);
			this.logger.log(LogBuilder.auth.logout(userUUID));
		}
	}

	private async sendChangeEmail(user: User, newEmail: string) {
		await this.mailService.sendEmail(
			[newEmail],
			"Change your email - Flex",
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
		userUUID: string,
		password: string,
		newEmail: string,
	) {
		const user = await this.users.getByUUID(userUUID);

		if (!user) {
			throw new AppForbiddenException("FORBIDDEN", "This shouldn't happen");
		}

		if (!user.password || !(await bcrypt.compare(password, user.password))) {
			throw new AppForbiddenException("INVALID_PASSWORD", "Invalid password");
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

		let user = await this.users.getByEmail(userData.email);

		if (!user) {
			user = await this.users.createFromIntra(
				userData.email,
				userData.login,
			);
		}

		if (!user) {
			throw new InternalServerErrorException("An error occured while creating the user");
		}

		return {
			accessToken: await this.generateAccessToken(user.uuid, user.emailValidated),
			refreshToken: await this.generateRefreshToken(
				user.uuid,
				userAgent ?? "",
				ipAddress ?? "unknown",
			),
		};
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
