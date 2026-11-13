import { ChatService } from "./chat.service";

export class ChatGateway {
	constructor(private readonly chatService: ChatService) {}
}
