import { Global, Module } from "@nestjs/common";
import { FriendsModule } from "../friends/friends.module";
import { PresenceGateway } from "./presence.gateway";
import { PresenceService } from "./presence.service";
import { AuthModule } from "../../auth/auth.module";

@Global()
@Module({
	imports: [FriendsModule, AuthModule],
	providers: [PresenceGateway, PresenceService],
	exports: [PresenceService],
})
export class PresenceModule {}
