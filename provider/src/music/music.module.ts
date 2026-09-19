import { MusicController } from './music.controller';
import { MusicService } from './music.service';
/*
https://docs.nestjs.com/modules
*/

import { Module } from '@nestjs/common';

@Module({
    imports: [],
    controllers: [
        MusicController,],
    providers: [
        MusicService,],
})
export class MusicModule { }
