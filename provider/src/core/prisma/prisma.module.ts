import { Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { PrismaBootstrapService } from './prisma-bootstrap.service';
import { ServerClientModule } from '../server/server-client.module';

@Module({
    imports: [ServerClientModule],
    controllers: [],
    providers: [PrismaService, PrismaBootstrapService],
    exports: [PrismaService],
})
export class PrismaModule {}
