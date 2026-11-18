import { Global, Module } from "@nestjs/common";
import { FriendsModule } from "../friends/friends.module";
import { PresenceGateway } from "./presence.gateway";
import { PresenceService } from "./presence.service";

@Global()
@Module({
	imports: [FriendsModule],
	providers: [PresenceGateway, PresenceService],
	exports: [PresenceService],
})
export class PresenceModule {}
