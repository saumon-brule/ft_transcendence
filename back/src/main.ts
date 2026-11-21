import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { apiContract, serverContract } from "@flex/shared";
import { SwaggerModule } from "@nestjs/swagger";
import { generateOpenApi } from "@ts-rest/open-api";
import cookieParser from "cookie-parser";
import { TsRestValidationFilter } from "./core/filters/ts-rest-validation.filter";
import { NestExpressApplication } from "@nestjs/platform-express";
import { env } from "./core/env";
import { customSwaggerJs } from "./swagger.dev";
import { AVATAR_DIR, COVER_DIR } from "./core/utils/constants";
import { mkdir } from "node:fs/promises";

async function bootstrap() {
	await Promise.all([AVATAR_DIR, COVER_DIR].map((dir) => mkdir(dir, { recursive: true })));

	const app = await NestFactory.create<NestExpressApplication>(AppModule);

	app.enableShutdownHooks();
	app.set("trust proxy", env.TRUST_PROXY);

	app.use(cookieParser());
	app.useGlobalFilters(new TsRestValidationFilter());

	const apiDocument = generateOpenApi(apiContract, {
		info: {
			title: "Flex public API",
			version: "1.0.0",
		},
		components: {
			securitySchemes: {
				apiKey: {
					type: "http",
					scheme: "bearer",
					description: "Your Flex API key",
				},
			},
		},
		security: [{ apiKey: [] }],
	});

	SwaggerModule.setup("api/swagger", app, apiDocument, {
		swaggerOptions: {
			persistAuthorization: true,
		},
	});

	if (env.NODE_ENV === "dev") {
		const document = generateOpenApi(serverContract, {
			info: {
				title: "Flex API",
				version: "1.0.0",
			},
			components: {
				securitySchemes: {
					bearerAuth: {
						type: "http",
						scheme: "bearer",
						bearerFormat: "JWT",
					},
				},
			},
			security: [{ bearerAuth: [] }],
		});

		SwaggerModule.setup("swagger", app, document, {
			swaggerOptions: {
				persistAuthorization: true,
			},
			customJsStr: customSwaggerJs,
		});
	}

	await app.listen(env.PORT ?? 3001);
}

bootstrap().catch((e) => console.error(e));
