import { Module } from '@nestjs/common';
import { ServerClientService } from './server-client.service';

@Module({
    imports: [],
    controllers: [],
    providers: [ServerClientService],
    exports: [ServerClientService],
})
export class ServerClientModule {}
