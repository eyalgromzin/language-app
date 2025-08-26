import { Test, TestingModule } from '@nestjs/testing';
import { TranslateService } from './translate.service';
import { WordCacheDbService } from '../database/services/word-cache-db.service';
import { TranslationDbService } from '../database/services/translation-db.service';

describe('TranslateService', () => {
  let service: TranslateService;
  let wordCacheService: WordCacheDbService;
  let translationDbService: TranslationDbService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TranslateService,
        {
          provide: WordCacheDbService,
          useValue: {
            getCachedTranslation: jest.fn(),
            setCachedTranslation: jest.fn(),
            record: jest.fn(),
          },
        },
        {
          provide: TranslationDbService,
          useValue: {
            getTranslation: jest.fn(),
            saveTranslation: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<TranslateService>(TranslateService);
    wordCacheService = module.get<WordCacheDbService>(WordCacheDbService);
    translationDbService = module.get<TranslationDbService>(TranslationDbService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('fetchTranslation', () => {
    it('should return the same word if from and to languages are the same', async () => {
      const result = await service.fetchTranslation('hello', 'en', 'en');
      expect(result).toBe('hello');
    });

    it('should return the same word if no word is provided', async () => {
      const result = await service.fetchTranslation('', 'en', 'es');
      expect(result).toBe('');
    });

    it('should check translation database first', async () => {
      const mockTranslation = 'hola';
      jest.spyOn(translationDbService, 'getTranslation').mockResolvedValue(mockTranslation);
      jest.spyOn(wordCacheService, 'record').mockResolvedValue(undefined);

      const result = await service.fetchTranslation('hello', 'en', 'es');
      
      expect(translationDbService.getTranslation).toHaveBeenCalledWith('hello', 'es');
      expect(result).toBe(mockTranslation);
      expect(wordCacheService.record).toHaveBeenCalledWith('hello');
    });

    it('should fallback to word cache if translation not in database', async () => {
      jest.spyOn(translationDbService, 'getTranslation').mockResolvedValue(null);
      const mockCachedTranslation = 'hola';
      jest.spyOn(wordCacheService, 'getCachedTranslation').mockResolvedValue(mockCachedTranslation);
      jest.spyOn(wordCacheService, 'record').mockResolvedValue(undefined);

      const result = await service.fetchTranslation('hello', 'en', 'es');
      
      expect(translationDbService.getTranslation).toHaveBeenCalledWith('hello', 'es');
      expect(wordCacheService.getCachedTranslation).toHaveBeenCalledWith('hello', 'en', 'es');
      expect(result).toBe(mockCachedTranslation);
    });
  });
});
