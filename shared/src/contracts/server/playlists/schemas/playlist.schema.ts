import { z } from "zod";

const playlistNameSchema = z.string().trim().min(1).
	max(64);

export const createPlaylistBodySchema = z.object({
	name: playlistNameSchema,
	private: z.boolean().default(false),
});

export const createdPlaylistSchema = z.object({
	uuid: z.string().uuid(),
	name: z.string(),
	private: z.boolean(),
});

export const MusicBodySchema = z.object({
	musicUUID: z.string().uuid(),
	providerUUID: z.string().uuid(),
});

export const updatePlaylistNameSchema = z.object({
	name: playlistNameSchema,
});

export const updatePlaylistPrivacySchema = z.object({
	private: z.boolean(),
});
