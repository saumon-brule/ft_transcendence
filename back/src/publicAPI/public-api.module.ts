import { Module } from "@nestjs/common";
import { PublicApiKeysService } from "./public-api.service";
import { ApiUserController } from "./api-user.controller";
import { UsersModule } from "../users/users.module";

@Module({
	imports: [UsersModule],
	controllers: [ApiUserController],
	providers: [PublicApiKeysService],
	exports: [PublicApiKeysService],
})
export class PublicApiModule { }
