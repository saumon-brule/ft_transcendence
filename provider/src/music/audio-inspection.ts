import { parseFile } from "music-metadata";

export type AudioExtension = "mp3" | "m4a" | "aac" | "flac" | "ogg" | "wav" | "webm";

export const AUDIO_MIME_BY_EXTENSION: Record<AudioExtension, string> = {
	mp3: "audio/mpeg",
	m4a: "audio/mp4",
	aac: "audio/aac",
	flac: "audio/flac",
	ogg: "audio/ogg",
	wav: "audio/wav",
	webm: "audio/webm",
};

export interface InspectedAudio {
	extension: AudioExtension;
	mime: string;
	durationSeconds: number;
}

function extensionFor(container: string | undefined, codec: string | undefined): AudioExtension | undefined {
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

export async function inspectAudio(path: string): Promise<InspectedAudio | undefined> {
	let format;
	try {
		({ format } = await parseFile(path, { duration: true }));
	} catch {
		return undefined;
	}

	const extension = extensionFor(format.container, format.codec);
	if (!extension) return undefined;

	const durationSeconds = format.duration ?? 0;
	if (!(durationSeconds > 0) || !(format.sampleRate && format.sampleRate > 0) || !(format.numberOfChannels && format.numberOfChannels > 0)) {
		return undefined;
	}
	if (format.hasVideo) return undefined;

	return { extension, mime: AUDIO_MIME_BY_EXTENSION[extension], durationSeconds };
}
