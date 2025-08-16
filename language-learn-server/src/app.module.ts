import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { LibraryService } from './library-to delete/library.service';
import { LibraryController } from './library-to delete/library.controller';

@Module({
  imports: [],
  controllers: [AppController, LibraryController],
  providers: [AppService, LibraryService],
})
export class AppModule {}
