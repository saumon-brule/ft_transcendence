import { Module } from "@nestjs/common";
import { ServerClientModule } from "../core/server/server-client.module";
import { AccessRequestController } from "./access-request.controller";
import { AccessRequestService } from "./access-request.service";

@Module({
	imports: [ServerClientModule],
	controllers: [AccessRequestController],
	providers: [AccessRequestService],
})
export class AccessRequestModule {}
