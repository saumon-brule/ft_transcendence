import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { providerContract } from "@flex/shared";
import { SwaggerModule } from "@nestjs/swagger";
import { generateOpenApi } from "@ts-rest/open-api";
import { NestExpressApplication } from "@nestjs/platform-express";
import { env } from "./core/env";
import { TsRestValidationFilter } from "./core/filters/ts-rest-validation.filter";

async function bootstrap() {
	const app = await NestFactory.create<NestExpressApplication>(AppModule);

	app.set("trust proxy", 1);
	app.useGlobalFilters(new TsRestValidationFilter());

	if (env.NODE_ENV === "dev") {
		const provider_document = generateOpenApi(providerContract, {
			info: {
				title: "Flex Provider API",
				description: "API for the Flex Provider service",
				version: "1.0.0"
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

		SwaggerModule.setup("api", app, provider_document, {
			swaggerOptions: { persistAuthorization: true },
		});
	}

	await app.listen(env.PORT ?? 3000);
}
bootstrap().catch((err) => { console.error(err) });
