import { Body, Controller, Post } from '@nestjs/common';
import { LibraryService } from './library.service';

@Controller('library')
export class LibraryController {
  constructor(private readonly libraryService: LibraryService) {}

  // POST /library/getUrls
  @Post('getUrls')
  getUrls(
    @Body() body: { language: string },
  ): { urls: { url: string; type: string; level: string }[] } {
    const urls = this.libraryService.getUrlsByLanguage(body.language);
    return { urls };
  }

  // POST /library/getUrlsWithCriterias
  @Post('getUrlsWithCriterias')
  getUrlsWithCriterias(
    @Body()
    body: { language: string; level: string | number; type: string | number },
  ): { urls: string[] } {
    const urls = this.libraryService.getUrlsWithCriteria(body.language, body.level, body.type);
    return { urls };
  }

  // POST /library/addUrl
  @Post('addUrl')
  addUrl(
    @Body()
    body: { url: string; language: string; level: string | number; type: string | number; name?: string; media?: string },
  ) {
    console.log('library add url', body);
    const item = this.libraryService.addUrl(body.url, body.language, body.level, body.type, body.name, body.media);
    return item;
  }
}
