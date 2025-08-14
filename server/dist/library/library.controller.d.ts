import { LibraryService } from './library.service';
export declare class LibraryController {
    private readonly libraryService;
    constructor(libraryService: LibraryService);
    getUrls(body: {
        language: string;
    }): {
        urls: string[];
    };
    getUrlsWithCriterias(body: {
        language: string;
        level: string;
        type: string | number;
    }): {
        urls: string[];
    };
    addUrl(body: {
        url: string;
        language: string;
        level: string;
        type: string | number;
        name?: string;
    }): {
        url: string;
        name?: string;
        language: string;
        typeId: number;
        level: string;
    };
}
