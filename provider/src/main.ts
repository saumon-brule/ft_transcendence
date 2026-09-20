import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { providerContract, serverContract } from "@flex/shared";
import { SwaggerModule } from "@nestjs/swagger";
import { generateOpenApi } from "@ts-rest/open-api";
import { NestExpressApplication } from "@nestjs/platform-express";
import { env } from "./core/env";

async function bootstrap() {
	const app = await NestFactory.create<NestExpressApplication>(AppModule);

	if (env.NODE_ENV === "dev") {
		const provider_document = generateOpenApi(providerContract, {
			info: {
				title: "Flex Provider API",
				description: "API for the Flex Provider service",
				version: "1.0.0"
			},
		});
		const server_document = generateOpenApi(serverContract, {
			info: {
				title: "Flex Server API",
				description: "API for the Flex Server service",
				version: "1.0.0"
			},
		});

		SwaggerModule.setup("provider-api", app, provider_document);
		SwaggerModule.setup("server-api", app, server_document);
	}

	await app.listen(env.PORT ?? 3000);
}
bootstrap().catch((err) => { console.error(err) });
