import { Module } from "@nestjs/common";
import { MediaModule } from "../media/media.module";
import { SearchModule } from "../search/search.module";
import { AlbumController } from "./album.controller";
import { AlbumService } from "./album.service";

@Module({
	imports: [MediaModule, SearchModule],
	controllers: [AlbumController],
	providers: [AlbumService],
})
export class AlbumModule {}
