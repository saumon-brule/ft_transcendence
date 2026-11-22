import { AppRoute, ClientInferResponses, ErrorHttpStatusCode, isErrorResponse } from "@ts-rest/core";

/**
 * solid-query mutations throw on non-2xx responses: turn them back into regular typed responses.
 * Anything else (network error, validation error...) is rethrown.
 */
export function settleResponse<T, R extends AppRoute>(promise: Promise<T>, route: R): Promise<T | ClientInferResponses<R, ErrorHttpStatusCode>> {
	return promise.catch((e: unknown) => {
		if (isErrorResponse(e, route)) return e;
		throw e;
	});
}
