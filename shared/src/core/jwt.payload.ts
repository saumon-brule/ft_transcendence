export function createJwtPayload(userId: number, emailVerified: boolean) {
	return { sub: userId, emailVerified };
}

export type JwtPayload = ReturnType<typeof createJwtPayload>;
