import { Module } from "@nestjs/common";
import { FriendsModule } from "../friends/friends.module";
import { ChatGateway } from "./chat.gateway";
import { ChatService } from "./chat.service";

@Module({
	imports: [FriendsModule],
	providers: [ChatGateway, ChatService],
	exports: [ChatService],
})
export class ChatModule {}
