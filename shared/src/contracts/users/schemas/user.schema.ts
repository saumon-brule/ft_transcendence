import { z } from "zod";

export const profileSchema = z.object({
	id: z.number(),
	email: z.string().email(),
	login: z.string().nullable(),
	displayName: z.string().nullable(),
	joinDate: z.date().nullable(),
});

export const userSchema = z.object({
	id: z.number(),
	login: z.string().nullable(),
	displayName: z.string().nullable(),
	joinDate: z.date().nullable(),
	// + liste des roles et toutes les choses a display sur un profile
});

export const userBasicSchema = z.object({
	id: z.number(),
	login: z.string().nullable(),
	displayName: z.string().nullable(),
});

export const addRoleUserSchema = z.object({
	roleId: z.number(),
});

export const DeleteRoleParamSchema = z.object({
	id: z.string().transform(Number),
	roleId: z.string().transform(Number),
});
