import { Module } from "@nestjs/common";
import { MediaModule } from "../media/media.module";
import { AlbumController } from "./album.controller";
import { AlbumService } from "./album.service";

@Module({
	imports: [MediaModule],
	controllers: [AlbumController],
	providers: [AlbumService],
})
export class AlbumModule {}
