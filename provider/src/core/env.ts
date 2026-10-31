import "dotenv/config";
import z from "zod";

const EnvSchema = z.object({
	FLEX_SERVER_URL: z.string().url(),
	DATABASE_URL: z.string(),
	FLEX_API_KEY: z.string(),
	NODE_ENV: z.enum(["dev", "prod"]),
	MEDIA_DIR: z.string().default("media"),
	// dev only: which half of mock/discography.v2.json to seed
	MOCK_DISCOGRAPHY: z.enum(["1", "2"]).optional(),
	PORT: z.coerce.number().int().positive()
		.max(65535)
		.default(3002),
});

const result = EnvSchema.safeParse(process.env);

if (!result.success) {
	console.error("Invalid environment variables:", result.error.flatten().fieldErrors);
	process.exit(1);
}

export const env = result.data;
