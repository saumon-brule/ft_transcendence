export type HSL = [h: number, s: number, l: number];
export type RGB = [r: number, g: number, b: number];

function hash53(str: string, seed = 0) {
	let h1 = 0xdeadbeef ^ seed;
	let h2 = 0x41c6ce57 ^ seed;
	for (let i = 0; i < str.length; i++) {
		const ch = str.charCodeAt(i);
		h1 = Math.imul(h1 ^ ch, 2654435761);
		h2 = Math.imul(h2 ^ ch, 1597334677);
	}
	h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
	h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
	return 4294967296 * (2097151 & h2) + (h1 >>> 0);
}

export function textToHSL(str: string, initialS = 0, initialL = 0, variationS = 100, variationL = 100): HSL {
	const int = hash53(str);
	const l = int % 10000;
	const h = Math.round((int % (10 ** 8)) / (10 ** 4));
	const s = Math.round((int % (10 ** 12)) / (10 ** 8));
	return [360 * (h / 9999), initialS + variationS * (s / 9999), initialL + variationL * (l / 9999)];
}

export function HSLToRGB(hsl: HSL): RGB {
	const [H, s, l] = hsl;
	const S = s / 100;
	const L = l / 100;
	const C = (1 - Math.abs(2 * L - 1)) * S;
	const X = (1 - Math.abs(((H / 60) % 2) - 1)) * C;
	const M = L - C / 2;
	let pR: number;
	let pG: number;
	let pB: number;
	if (H < 60) {
		pR = C;
		pG = X;
		pB = 0;
	} else if (H < 120) {
		pR = X;
		pG = C;
		pB = 0;
	} else if (H < 180) {
		pR = 0;
		pG = C;
		pB = X;
	} else if (H < 240) {
		pR = 0;
		pG = X;
		pB = C;
	} else if (H < 300) {
		pR = X;
		pG = 0;
		pB = C;
	} else {
		pR = C;
		pG = 0;
		pB = X;
	}

	return [(pR + M) * 255, (pG + M) * 255, (pB + M) * 255];
}

export function HSLToCSS(hsl: HSL) {
	const [h, s, l] = hsl;
	return `hsl(${h}, ${s}%, ${l}%)`;
}

export function RGBToCSS(rgb: RGB) {
	const [r, g, b] = rgb;
	return `rgb(${r}, ${g}, ${b})`;
}

export function RGBToHEX(rgb: RGB) {
	return `#${rgb.map((c) => Math.round(c).toString(16).padStart(2, "0")).join("")}`.toUpperCase();
}

export function textToCSS(text: string) {
	return HSLToCSS(textToHSL(text));
}
