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

export const playlistDetailSchema = z.object({
	uuid: z.string().uuid(),
	name: z.string(),
	private: z.boolean(),
	createdAt: z.coerce.date(),
	owner: z.object({
		uuid: z.string().uuid(),
		username: z.string(),
	}),
	isOwner: z.boolean(),
	isFollowing: z.boolean(),
	musics: z.array(z.object({
		musicUuid: z.string().uuid(),
		providerUuid: z.string().uuid(),
		addedAt: z.coerce.date(),
	})),
	providers: z.array(z.object({
		uuid: z.string().uuid(),
		name: z.string(),
		address: z.string(),
	})),
});
export type PlaylistDetailDto = z.infer<typeof playlistDetailSchema>;
