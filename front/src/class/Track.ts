import z from "zod";
import { Music } from "./Music";

export class Track {
	constructor(
		public music: Music,
		public temporary: boolean = false,
	) {}

	static zodSchema = z.object({
		music: Music.zodSchema,
		temporary: z.boolean(),
	}).transform((track): Track => {
		Object.setPrototypeOf(track, Track.prototype);
		return track;
	});
}
