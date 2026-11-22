import { ApiFetcherArgs, isZodType } from "@ts-rest/core";

function parseXhrHeaders(raw: string): Headers {
	const headers = new Headers();
	for (const line of raw.trim().split(/[\r\n]+/)) {
		const sep = line.indexOf(":");
		if (sep > 0) headers.append(line.slice(0, sep).trim(), line.slice(sep + 1).trim());
	}
	return headers;
}

export function xhrFetchApi(args: ApiFetcherArgs, onProgress: (r: number) => void) {
	return new Promise<{ status: number; body: unknown; headers: Headers }>((resolve, reject) => {
		const xhr = new XMLHttpRequest();
		xhr.open(args.method, args.path);
		for (const [key, value] of Object.entries(args.headers)) {
			xhr.setRequestHeader(key, value);
		}
		xhr.upload.onprogress = (e) => {
			if (e.lengthComputable) {
				onProgress(e.loaded / e.total);
			}
		};
		xhr.onload = () => {
			const headers = parseXhrHeaders(xhr.getAllResponseHeaders());
			const contentType = headers.get("content-type") ?? "";
			let body: unknown = xhr.responseText;
			if (contentType.includes("application/") && contentType.includes("json")) {
				try {
					body = JSON.parse(xhr.responseText);
				} catch {}
				const schema: unknown = args.route.responses[xhr.status];
				if (args.validateResponse && isZodType(schema)) {
					try {
						body = schema.parse(body);
					} catch (e) {
						reject(e instanceof Error ? e : new Error(String(e)));
						return;
					}
				}
			}
			resolve({ status: xhr.status, body, headers });
		};
		xhr.onerror = () => reject(new Error("Network error"));
		xhr.send(args.body);
	});
}
