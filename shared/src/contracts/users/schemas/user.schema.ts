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
	publicDisplay: z.boolean(),
});
export const playlistSchema = z.object({
	uuid: z.string().uuid(),
	name: z.string(),
	private: z.boolean(),
	_count: z.object({
		musics: z.number(),
	}),
});
export const musicSchema = z.object({
	uuid: z.string().uuid(),
	title: z.string(),
	artist: z.string(),
	duration: z.number(),
});

export const userSchema = z.object({
	uuid: z.string().uuid(),
	username: z.string(),
	createdAt: z.date(),
	currentlyListening: musicSchema.nullable(),
	listeningUntil: z.date().nullable(),
	ownedProviders: z.array(providerSchema),
	connectedProviders: z.array(providerSchema),
	ownedPlaylists: z.array(playlistSchema),
	_count: z.object({
		ownedProviders: z.number(),
		ownedPlaylists: z.number(),
	}),
});
export const shortUserSchema = z.object({
	uuid: z.string().uuid(),
	username: z.string(),
});

export type User = z.infer<typeof userSchema>;

export const meSchema = z.object({
	uuid: z.string().uuid(),
	username: z.string(),
	email: z.string().email(),
	createdAt: z.date(),
	currentlyListening: musicSchema.nullable(),
	listeningUntil: z.date().nullable(),
	ownedProviders: z.array(providerSchema),
	connectedProviders: z.array(providerSchema),
	ownedPlaylists: z.array(playlistSchema),
	friends: z.array(shortUserSchema),
	friendRequests: z.array(shortUserSchema),
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
