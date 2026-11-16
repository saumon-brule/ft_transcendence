import { Module } from "@nestjs/common";
import { AccessRequestModule } from "../access-request/access-request.module";
import { SettingController } from "./setting.controller";
import { SettingService } from "./setting.service";

@Module({
	imports: [AccessRequestModule],
	controllers: [SettingController],
	providers: [SettingService],
})
export class SettingModule {}
