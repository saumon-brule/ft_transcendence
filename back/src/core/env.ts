import "dotenv/config";
import z from "zod";

const EnvSchema = z.object({
	DATABASE_URL: z.string(),
	JWT_SECRET: z.string(),
	JWT_REFRESH_SECRET: z.string(),
	API42_CLIENT_UID: z.string(),
	API42_CLIENT_SECRET: z.string(),
	NODE_ENV: z.enum(["dev", "prod"]),
	SMTP_HOST: z.string(),
	SMTP_PORT: z.string().transform(Number),
	SMTP_USER: z.string(),
	SMTP_PASS: z.string(),
	PORT: z.string().transform(Number).optional(),
	BASE_FRONT_URL: z.string(),
	UPLOADS_DIR: z.string().default("uploads"),
	PROVIDER_KEY_PATH: z.string().default("provider.pem"),
	LOG_DIR: z.string().default("logs"),
	TRUST_PROXY: z.string().default("1")
		.transform((value) => {
			if (/^\d+$/.test(value)) return Number(value);
			if (value === "true" || value === "false") return value === "true";
			return value;
		}),
});

const result = EnvSchema.safeParse(process.env);

if (!result.success) {
	console.error("Invalid environment variables:", result.error.flatten().fieldErrors);
	process.exit(1);
}

export const env = result.data;
