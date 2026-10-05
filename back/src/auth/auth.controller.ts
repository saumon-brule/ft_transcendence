import { Controller, UseGuards, Req, Res } from "@nestjs/common";
import { AuthService } from "./auth.service";
import type { Response, Request } from "express";
import { JwtAuthRefreshGuard } from "../core/guards/jwt-refresh.guard";
import {
	type AuthUser,
	CurrentUser,
} from "../core/decorators/current-user.decorator";
import { tsRestHandler, TsRestHandler } from "@ts-rest/nest";
import { authContract } from "@flex/shared";
import {
	JwtAuthGuard,
	JwtAuthGuardWithoutEmailVerif,
	JwtNoAuthGuard,
} from "../core/guards/jwt-auth.guard";
import { Throttle } from "@nestjs/throttler";
import { env } from "../core/env";

@Controller()
export class AuthController {
	constructor(private readonly authService: AuthService) {}

	private setRefreshTokenCookie(res: Response, token: string | null) {
		const isProd = env.NODE_ENV === "prod";

		const options = {
			httpOnly: true,
			secure: isProd,
			sameSite: "strict" as const,
			path: "/",
		};

		if (!token) {
			res.cookie("refresh_token", "", { ...options, expires: new Date(0) });
			return;
		}

		res.cookie("refresh_token", token, {
			...options,
			maxAge: 1000 * 60 * 60 * 24 * 7,
		});
	}

	@Throttle({ default: { limit: 3, ttl: 60000 } })
	@UseGuards(JwtNoAuthGuard)
	@TsRestHandler(authContract.register)
	public register(
		@Req() req: Request,
		@Res({ passthrough: true }) res: Response,
	) {
		return tsRestHandler(authContract.register, async ({ body }) => {
			const { accessToken, refreshToken } = await this.authService.register(
				body,
				req.headers["user-agent"],
				req.ip,
			);

			this.setRefreshTokenCookie(res, refreshToken);

			return { status: 200, body: { accessToken } };
		});
	}

	@Throttle({ default: { limit: 20, ttl: 60000 } })
	@UseGuards(JwtNoAuthGuard)
	@TsRestHandler(authContract.login)
	public login(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
		return tsRestHandler(authContract.login, async ({ body }) => {
			const { accessToken, refreshToken } = await this.authService.login(
				body,
				req.headers["user-agent"],
				req.ip,
			);

			this.setRefreshTokenCookie(res, refreshToken);

			return { status: 200, body: { accessToken } };
		});
	}

	@TsRestHandler(authContract.logout)
	@UseGuards(JwtAuthRefreshGuard)
	public logout(
		@CurrentUser() user: AuthUser,
		@Res({ passthrough: true }) res: Response,
	) {
		return tsRestHandler(authContract.logout, async () => {
			await this.authService.logout(user.uuid, user.jti);

			this.setRefreshTokenCookie(res, null);

			return { status: 204, body: null };
		});
	}

	@TsRestHandler(authContract.refresh)
	@UseGuards(JwtAuthRefreshGuard)
	public refresh(
		@CurrentUser() user: AuthUser,
		@Req() req: Request,
		@Res({ passthrough: true }) res: Response,
	) {
		return tsRestHandler(authContract.refresh, async () => {
			const { accessToken, refreshToken } = await this.authService.refresh(
				user.uuid,
				user.jti,
				req.headers["user-agent"],
				req.ip,
			);

			this.setRefreshTokenCookie(res, refreshToken);

			return { status: 200, body: { accessToken } };
		});
	}

	@TsRestHandler(authContract.confirmEmail)
	public confirmEmail() {
		return tsRestHandler(authContract.confirmEmail, async ({ body }) => {
			await this.authService.confirmEmail(body.token);
			return { status: 204, body: null };
		});
	}

	@Throttle({ default: { limit: 1, ttl: 60000 } })
	@TsRestHandler(authContract.askNewConfirmationEmail)
	@UseGuards(JwtAuthGuardWithoutEmailVerif)
	public askNewConfirmationEmail(@CurrentUser() user: AuthUser) {
		return tsRestHandler(authContract.askNewConfirmationEmail, async () => {
			await this.authService.askNewConfirmationEmail(user.uuid);
			return { status: 204, body: null };
		});
	}

	@TsRestHandler(authContract.changePassword)
	@UseGuards(JwtAuthGuard)
	public changePassword(@CurrentUser() user: AuthUser) {
		return tsRestHandler(authContract.changePassword, async ({ body }) => {
			await this.authService.changePassword(
				user.uuid,
				body.oldPassword,
				body.newPassword,
			);
			return { status: 204, body: null };
		});
	}

	@Throttle({ default: { limit: 1, ttl: 60000 } })
	@TsRestHandler(authContract.requestPasswordReset)
	public requestPasswordReset() {
		return tsRestHandler(
			authContract.requestPasswordReset,
			async ({ body }) => {
				await this.authService.requestPasswordReset(body.email);
				return { status: 204, body: null };
			},
		);
	}

	@TsRestHandler(authContract.resetPassword)
	public resetPassword() {
		return tsRestHandler(authContract.resetPassword, async ({ body }) => {
			await this.authService.resetPassword(body.token, body.newPassword);
			return { status: 204, body: null };
		});
	}

	@Throttle({ default: { limit: 1, ttl: 60000 } })
	@TsRestHandler(authContract.requestEmailReset)
	@UseGuards(JwtAuthGuard)
	public requestEmailReset(@CurrentUser() user: AuthUser) {
		return tsRestHandler(authContract.requestEmailReset, async ({ body }) => {
			await this.authService.requestEmailReset(
				user.uuid,
				body.password,
				body.newEmail,
			);
			return { status: 204, body: null };
		});
	}

	@TsRestHandler(authContract.resetEmail)
	public resetEmail() {
		return tsRestHandler(authContract.resetEmail, async ({ body }) => {
			await this.authService.resetEmail(body.token);
			return { status: 204, body: null };
		});
	}

	@Throttle({ default: { limit: 20, ttl: 60000 } })
	@UseGuards(JwtNoAuthGuard)
	@TsRestHandler(authContract.redirectLogin42url)
	public redirectAuth42(@Res() res: Response) {
		return tsRestHandler(authContract.redirectLogin42url, async () => {
			res.redirect(await this.authService.get42LoginUrl());
			return { status: 302, body: null };
		});
	}

	@Throttle({ default: { limit: 20, ttl: 60000 } })
	@UseGuards(JwtNoAuthGuard)
	@TsRestHandler(authContract.getLogin42url)
	public getAuth42Url() {
		return tsRestHandler(authContract.getLogin42url, async () => {
			return { status: 200, body: { url: await this.authService.get42LoginUrl() } };
		});
	}

	@Throttle({ default: { limit: 20, ttl: 60000 } })
	@TsRestHandler(authContract.auth42)
	public auth42(
		@Req() req: Request,
		@Res({ passthrough: true }) res: Response,
	) {
		return tsRestHandler(authContract.auth42, async ({ body }) => {
			const { accessToken, refreshToken } = await this.authService.auth42(
				body.code,
				body.state,
				req.headers["user-agent"],
				req.ip,
			);

			this.setRefreshTokenCookie(res, refreshToken);

			return { status: 200, body: { accessToken } };
		});
	}

}
