export function createJwtPayload(userUUID: string, emailVerified: boolean) {
	return { sub: userUUID, emailVerified };
}

export type JwtPayload = ReturnType<typeof createJwtPayload>;

export const providerTokenScopes = ["access", "request-access"] as const;
export type ProviderTokenScope = (typeof providerTokenScopes)[number];

export function createProviderJwtPayload(scope: ProviderTokenScope) {
	return { scope };
}

export type ProviderJwtPayload = ReturnType<typeof createProviderJwtPayload>;
