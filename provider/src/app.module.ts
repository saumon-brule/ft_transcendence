import { PrismaBootstrapService } from './core/prisma/prisma-bootstrap.service';
import { PrismaModule } from './core/prisma/prisma.module';
import { MusicModule } from './music/music.module';
import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';

@Module({
  imports: [
    PrismaModule,
    MusicModule,],
  controllers: [AppController],
  providers: [
    PrismaBootstrapService, AppService],
})
export class AppModule { }
