interface ConflictLike {
	code?: string;
	cause?: { kind?: string };
}

// P2034 (erreur Prisma) ou échec de sérialisation Postgres remonté par le driver adapter
export function isWriteConflict(error: unknown) {
	const { code, cause } = (error ?? {}) as ConflictLike;
	return code === "P2034" || cause?.kind === "TransactionWriteConflict";
}

export async function retryOnWriteConflict<T>(run: () => Promise<T>, attempts = 4): Promise<T> {
	for (let attempt = 1; ; attempt++) {
		try {
			return await run();
		} catch (error) {
			if (attempt >= attempts || !isWriteConflict(error)) throw error;
		}
	}
}
