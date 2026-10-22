import { z } from "zod";
import { providerSchema } from "../../providers/schemas/provider.schema";

export const profileSchema = z.object({
	id: z.number(),
	email: z.string().email(),
	username: z.string(),
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

export const shortUserSchema = z.object({
	uuid: z.string().uuid(),
	username: z.string(),
});

export const userSchema = z.object({
	uuid: z.string().uuid(),
	username: z.string(),
	createdAt: z.coerce.date(),
	currentlyListening: musicSchema.nullable(),
	listeningUntil: z.coerce.date().nullable(),
	ownedProviders: z.array(providerSchema),
	connectedProviders: z.array(providerSchema),
	ownedPlaylists: z.array(playlistSchema),
	friends: z.array(shortUserSchema),
	_count: z.object({
		ownedProviders: z.number(),
		ownedPlaylists: z.number(),
	}),
});

export type User = z.infer<typeof userSchema>;

export const meSchema = z.object({
	uuid: z.string().uuid(),
	username: z.string(),
	email: z.string().email(),
	intraId: z.number().nullable(),
	language: z.string(),
	hasPassword: z.boolean(),
	listeningPrivate: z.boolean(),
	createdAt: z.coerce.date(),
	currentlyListening: musicSchema.nullable(),
	listeningUntil: z.coerce.date().nullable(),
	avatarUpdatedAt: z.coerce.date(),
	ownedProviders: z.array(providerSchema),
	connectedProviders: z.array(providerSchema),
	ownedPlaylists: z.array(playlistSchema),
	friends: z.array(shortUserSchema),
	friendRequests: z.array(shortUserSchema),
});
export type Profile = z.infer<typeof meSchema>;

export const updateMeSchema = z.object({
	username: z.string().min(3).max(32).
		optional(),
	language: z.string().optional(),
	listeningPrivate: z.boolean().optional(),
});
export type UpdateMeDto = z.infer<typeof updateMeSchema>;

export const userBasicSchema = z.object({
	id: z.number(),
	login: z.string().nullable(),
	username: z.string(),
});

export const addRoleUserSchema = z.object({
	roleId: z.number(),
});

export const DeleteRoleParamSchema = z.object({
	uuid: z.string().uuid(),
	roleId: z.string().transform(Number),
});
