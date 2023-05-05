import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { DBService } from './db.service';

@Module({
	imports: [],
	controllers: [AppController],
	providers: [DBService]
})
export class AppModule {}

