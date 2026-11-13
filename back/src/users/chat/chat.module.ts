import { Module } from "@nestjs/common";
import { AuthModule } from "../../auth/auth.module";
import { ChatGateway } from "./chat.gateway";
import { ChatService } from "./chat.service";

@Module({
	imports: [AuthModule],
	providers: [ChatGateway, ChatService],
	exports: [ChatService],
})
export class ChatModule {}
