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
export type ShortUser = z.infer<typeof shortUserSchema>;

export const USERS_BATCH_MAX = 100;

export const usersBatchSchema = z.object({
	uuids: z.array(z.string().uuid()).min(1).
		max(USERS_BATCH_MAX),
});
export type UsersBatchDto = z.infer<typeof usersBatchSchema>;

export const usersBatchResponseSchema = z.object({
	users: z.array(shortUserSchema),
	missing: z.array(z.string().uuid()),
});
export type UsersBatchResponse = z.infer<typeof usersBatchResponseSchema>;

export const onlineStatusSchema = z.enum(["online", "offline"]);
export type OnlineStatus = z.infer<typeof onlineStatusSchema>;

export const friendSchema = shortUserSchema.extend({
	status: onlineStatusSchema,
});
export type Friend = z.infer<typeof friendSchema>;

export const userSchema = z.object({
	uuid: z.string().uuid(),
	username: z.string(),
	createdAt: z.coerce.date(),
	ownedProviders: z.array(providerSchema),
	connectedProviders: z.array(providerSchema),
	ownedPlaylists: z.array(playlistSchema),
	friends: z.array(friendSchema.partial({ status: true })),
	status: onlineStatusSchema.optional(),
	_count: z.object({
		ownedProviders: z.number(),
		ownedPlaylists: z.number(),
	}),
});

export type User = z.infer<typeof userSchema>;

export const languageEnum = z.enum(["en", "fr", "ja", "es"]);
export type Language = z.infer<typeof languageEnum>;

export const meSchema = z.object({
	uuid: z.string().uuid(),
	username: z.string(),
	email: z.string().email(),
	intraId: z.number().nullable(),
	language: languageEnum,
	hasPassword: z.boolean(),
	createdAt: z.coerce.date(),
	avatarUpdatedAt: z.coerce.date(),
	ownedProviders: z.array(providerSchema),
	connectedProviders: z.array(providerSchema),
	ownedPlaylists: z.array(playlistSchema),
	friends: z.array(friendSchema),
	friendRequests: z.array(shortUserSchema),
	apiUsage: z.number(),
	apiOneHourUsage: z.number(),
	_count: z.object({
		ownedProviders: z.number(),
		ownedPlaylists: z.number(),
	}),
});
export type Profile = z.infer<typeof meSchema>;

export const updateMeSchema = z.object({
	username: z.string().min(3).max(32).
		optional(),
	language: languageEnum.optional(),
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

export const searchUsersQuerySchema = z.object({
	username: z.string().trim().min(1).
		max(50).
		optional(),
});
