import { Module } from "@nestjs/common";
import { ServerClientModule } from "../core/server/server-client.module";
import { MemberController } from "./member.controller";
import { MemberService } from "./member.service";

@Module({
	imports: [ServerClientModule],
	controllers: [MemberController],
	providers: [MemberService],
})
export class MemberModule {}
