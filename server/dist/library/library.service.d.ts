type LibraryItem = {
    url: string;
    name?: string;
    language: string;
    typeId: number;
    level: string;
};
export declare class LibraryService {
    private loadLibrary;
    private saveLibrary;
    getUrlsByLanguage(language: string): string[];
    getUrlsWithCriteria(language: string, level: string, type: string | number): string[];
    addUrl(url: string, language: string, level: string, type: string | number, name?: string): LibraryItem;
    private resolveTypeId;
}
export {};
