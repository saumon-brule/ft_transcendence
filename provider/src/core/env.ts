import z from "zod";

const EnvSchema = z.object({
	DATABASE_URL: z.string(),
	NODE_ENV: z.enum(["dev", "prod"]),
	PORT: z.string().transform(Number).optional(),
	SERVER_URL: z.url()
});

const result = EnvSchema.safeParse(process.env);

if (!result.success) {
	console.error("Invalid environment variables:", z.treeifyError(result.error).errors);
	process.exit(1);
}

export const env = result.data;