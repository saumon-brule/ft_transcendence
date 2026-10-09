import { Module } from "@nestjs/common";
import { FriendsService } from "./friends.service";
import { FriendsController } from "./friends.controller";
import { LoggingModule } from "../../core/logging/logging.module";
import { UsersModule } from "../users.module";

@Module({
	imports: [LoggingModule, UsersModule],
	providers: [FriendsService],
	controllers: [FriendsController],
	exports: [FriendsService],
})
export class FriendsModule { }
