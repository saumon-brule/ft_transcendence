import { Module } from "@nestjs/common";
import { UsersService } from "./users.service";
import { UsersController } from "./users.controller";
import { RolesModule } from "../roles/roles.module";
import { LoggingModule } from "../core/logging/logging.module";

@Module({
	imports: [RolesModule, LoggingModule],
	providers: [UsersService],
	controllers: [UsersController],
	exports: [UsersService],
})
export class UsersModule { }
