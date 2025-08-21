import { Body, Controller, Post } from '@nestjs/common';
import { LibraryService } from './library.service';

@Controller('library')
export class LibraryController {
  constructor(private readonly libraryService: LibraryService) {}


  // POST /library/getUrlsWithCriterias
  @Post('getUrlsWithCriterias')
  getUrlsWithCriterias(
    @Body()
    body: { language: string; level?: string | number; type?: string | number; media?: string },
  ): { urls: { url: string; name?: string; type: string; level: string; media: string }[] } {
    const urls = this.libraryService.getUrlsWithCriteria(body.language, body.level, body.type, body.media);
    return { urls };
  }

  // POST /library/addUrl
  @Post('addUrl')
  addUrl(
    @Body()
    body: { url: string; language: string; level: string | number; type: string | number; name: string; media: string },
  ) {
    console.log('library add url', body);
    const item = this.libraryService.addUrl(body.url, body.language, body.level, body.type, body.name, body.media);
    return item;
  }

  // POST /library/getMeta
  @Post('getMeta')
  getMeta(): { itemTypes: string[]; levels: string[] } {
    return this.libraryService.getMeta();
  }
}
