import { JwtModule } from "@nestjs/jwt";
import { Module } from "@nestjs/common";
import { FriendsModule } from "../friends/friends.module";
import { PresenceGateway } from "./presence.gateway";
import { PresenceService } from "./presence.service";

@Module({
	imports: [JwtModule.register({}), FriendsModule],
	providers: [PresenceGateway, PresenceService],
	exports: [PresenceService],
})
export class PresenceModule {}
