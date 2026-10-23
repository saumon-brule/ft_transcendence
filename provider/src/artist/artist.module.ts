import { Module } from "@nestjs/common";
import { MediaModule } from "../media/media.module";
import { ArtistController } from "./artist.controller";
import { ArtistService } from "./artist.service";

@Module({
	imports: [MediaModule],
	controllers: [ArtistController],
	providers: [ArtistService],
})
export class ArtistModule {}
