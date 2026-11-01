import { readFile } from "node:fs/promises";
import type { MediaType } from "@flex/shared";
import { imageSize } from "image-size";
import { parseFile } from "music-metadata";

export interface MediaFormat {
	mime: string;
	extensions: readonly string[];
	mimes: readonly string[];
}

const AUDIO_FORMATS = {
	mp3: { mime: "audio/mpeg", extensions: ["mp3"], mimes: ["audio/mpeg", "audio/mp3", "audio/x-mpeg"] },
	m4a: { mime: "audio/mp4", extensions: ["m4a", "mp4", "m4b"], mimes: ["audio/mp4", "audio/x-m4a", "audio/m4a", "video/mp4"] },
	aac: { mime: "audio/aac", extensions: ["aac"], mimes: ["audio/aac", "audio/x-aac", "audio/aacp"] },
	flac: { mime: "audio/flac", extensions: ["flac"], mimes: ["audio/flac", "audio/x-flac"] },
	ogg: { mime: "audio/ogg", extensions: ["ogg", "oga", "opus", "spx"], mimes: ["audio/ogg", "audio/opus", "audio/vorbis", "audio/x-ogg", "application/ogg"] },
	wav: { mime: "audio/wav", extensions: ["wav", "wave"], mimes: ["audio/wav", "audio/x-wav", "audio/wave", "audio/vnd.wave"] },
	webm: { mime: "audio/webm", extensions: ["webm", "weba"], mimes: ["audio/webm", "video/webm"] },
} as const satisfies Record<string, MediaFormat>;
type AudioExtension = keyof typeof AUDIO_FORMATS;

const IMAGE_FORMATS = {
	jpg: { mime: "image/jpeg", extensions: ["jpg", "jpeg", "jpe", "jfif"], mimes: ["image/jpeg", "image/jpg", "image/pjpeg"] },
	png: { mime: "image/png", extensions: ["png"], mimes: ["image/png", "image/x-png"] },
	webp: { mime: "image/webp", extensions: ["webp"], mimes: ["image/webp"] },
} as const satisfies Record<string, MediaFormat>;
type ImageExtension = keyof typeof IMAGE_FORMATS;

const UNSPECIFIED_MIMES = ["application/octet-stream", "text/plain"];
const MAX_IMAGE_SIDE_PIXELS = 8192;

export function declaredMismatch(format: MediaFormat, originalName: string, declaredMime: string) {
	const dot = originalName.lastIndexOf(".");
	const extension = dot === -1
		? ""
		: originalName.slice(dot + 1).toLowerCase();
	if (!format.extensions.includes(extension)) {
		return `the file extension ".${extension}" does not match its content`;
	}

	const mime = declaredMime.split(";")[0].trim().toLowerCase();
	if (mime && !UNSPECIFIED_MIMES.includes(mime) && !format.mimes.includes(mime)) {
		return `the declared type "${mime}" does not match its content`;
	}
	return undefined;
}

function audioExtensionFor(container: string | undefined, codec: string | undefined): AudioExtension | undefined {
	if (!container) return undefined;

	if (container === "MPEG") return codec?.includes("Layer 3")
		? "mp3"
		: undefined;
	if (container.startsWith("ADTS")) return "aac";
	if (container === "FLAC") return "flac";
	if (container.startsWith("M4A")) return "m4a";
	if (container === "Ogg") return "ogg";
	if (container === "WAVE") return "wav";
	if (container === "EBML/webm") return "webm";
	return undefined;
}

async function inspectAudio(path: string): Promise<AudioExtension | undefined> {
	let format;
	try {
		({ format } = await parseFile(path, { duration: true }));
	} catch {
		return undefined;
	}

	const durationSeconds = format.duration ?? 0;
	if (!(durationSeconds > 0) || !(format.sampleRate && format.sampleRate > 0) || !(format.numberOfChannels && format.numberOfChannels > 0)) {
		return undefined;
	}
	if (format.hasVideo) return undefined;

	return audioExtensionFor(format.container, format.codec);
}

async function inspectImage(path: string): Promise<ImageExtension | undefined> {
	let size;
	try {
		size = imageSize(await readFile(path));
	} catch {
		return undefined;
	}

	if (size.type !== "jpg" && size.type !== "png" && size.type !== "webp") return undefined;
	if (!(size.width > 0) || !(size.height > 0)) return undefined;
	if (size.width > MAX_IMAGE_SIDE_PIXELS || size.height > MAX_IMAGE_SIDE_PIXELS) return undefined;

	return size.type;
}

export interface MediaTypeConfig {
	label: string;
	noun: string;
	directory: string;
	formats: Record<string, MediaFormat>;
	accepted: string;
	cacheControl: string;
	inspect: (path: string) => Promise<string | undefined>;
}

const image = {
	formats: IMAGE_FORMATS,
	accepted: `jpeg, png or webp, ${MAX_IMAGE_SIDE_PIXELS} px max per side`,
	cacheControl: "private, no-cache",
	inspect: inspectImage,
};

const audio = {
	formats: AUDIO_FORMATS,
	accepted: "mp3, m4a, aac, flac, ogg, wav or webm",
	cacheControl: "private, no-store",
	inspect: inspectAudio,
};

export const MEDIA_TYPE_CONFIG: Record<MediaType, MediaTypeConfig> = {
	"audio": { ...audio, label: "Music", noun: "audio file", directory: "audio" },
	"musicCover": { ...image, label: "Music", noun: "cover", directory: "images/music" },
	"albumCover": { ...image, label: "Album", noun: "cover", directory: "images/album" },
	"artistAvatar": { ...image, label: "Artist", noun: "avatar", directory: "images/artist" },
};
