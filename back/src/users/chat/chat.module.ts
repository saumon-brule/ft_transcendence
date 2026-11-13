import { Module } from "@nestjs/common";
import { AuthModule } from "../../auth/auth.module";
import { FriendsModule } from "../friends/friends.module";
import { ChatGateway } from "./chat.gateway";
import { ChatService } from "./chat.service";

@Module({
	imports: [AuthModule, FriendsModule],
	providers: [ChatGateway, ChatService],
	exports: [ChatService],
})
export class ChatModule {}
