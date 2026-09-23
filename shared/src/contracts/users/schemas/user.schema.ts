import { z } from "zod";

export const profileSchema = z.object({
	id: z.number(),
	email: z.string().email(),
	username: z.string(),
});

// Surement a bouger plus tard
export const providerSchema = z.object({
	uuid: z.string().uuid(),
	name: z.string(),
	adress: z.string(),
});
export const playlistSchema = z.object({
	uuid: z.string().uuid(),
	name: z.string(),
	_count: z.object({
		musics: z.number(),
	}),
});

export const userSchema = z.object({
	uuid: z.string().uuid(),
	username: z.string(),
	picture: z.string().nullable(),
	createdAt: z.date(),
	ownedProviders: z.array(providerSchema),
	providers: z.array(providerSchema),
	ownedPlaylists: z.array(playlistSchema),
});

export const userBasicSchema = z.object({
	id: z.number(),
	login: z.string().nullable(),
	username: z.string(),
});

export const addRoleUserSchema = z.object({
	roleId: z.number(),
});

export const DeleteRoleParamSchema = z.object({
	id: z.string().transform(Number),
	roleId: z.string().transform(Number),
});
