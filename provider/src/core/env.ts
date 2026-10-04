import "dotenv/config";
import z from "zod";

const EnvSchema = z.object({
	FLEX_SERVER_URL: z.string().url(),
	DATABASE_URL: z.string(),
	FLEX_API_KEY: z.string(),
	FLEX_SERVER_MOCK: z.enum(["true", "false"]).default("false").transform((value) => value === "true"),
	NODE_ENV: z.enum(["dev", "prod"]),
	PORT: z.coerce.number().int().positive().max(65535).default(3000),
	MUSIC_DIR: z.string().default("music"),
});

const result = EnvSchema.safeParse(process.env);

if (!result.success) {
	console.error("Invalid environment variables:", result.error.flatten().fieldErrors);
	process.exit(1);
}

if (result.data.NODE_ENV === "prod" && result.data.FLEX_SERVER_MOCK) {
	console.error("Invalid environment variables: FLEX_SERVER_MOCK cannot be used with NODE_ENV=prod");
	process.exit(1);
}

export const env = result.data;
