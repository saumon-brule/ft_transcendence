export function createJwtPayload(userUUID: string, emailVerified: boolean) {
	return { sub: userUUID, emailVerified };
}

export type JwtPayload = ReturnType<typeof createJwtPayload>;
