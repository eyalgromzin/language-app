import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Translation } from '../entities/translation.entity';

@Injectable()
export class TranslationService {
  constructor(
    @InjectRepository(Translation)
    private translationRepository: Repository<Translation>,
  ) {}

  async findTranslationByWord(word: string, fromLang: string): Promise<Translation | null> {
    const translation = await this.translationRepository.findOne({
      where: {
        [fromLang]: word,
      },
    });

    return translation;
  }

  async saveTranslation(word: string, translation: string, fromLang: string, toLang: string): Promise<void> {
    // Check if a record with this word already exists in the fromLang column
    let existingTranslation = await this.translationRepository.findOne({
      where: {
        [fromLang]: word,
      },
    });

    if (existingTranslation) {
      // Update existing record with the new translation
      (existingTranslation as any)[toLang] = translation;
      await this.translationRepository.save(existingTranslation);
    } else {
      // Check if the word exists in any other language column
      const wordInAnyLang = await this.findTranslationByAnyLanguage(word);
      
      if (wordInAnyLang) {
        // Update existing record with the new translation
        (wordInAnyLang as any)[toLang] = translation;
        await this.translationRepository.save(wordInAnyLang);
      } else {
        // Create new record
        const newTranslation = new Translation();
        (newTranslation as any)[fromLang] = word;
        (newTranslation as any)[toLang] = translation;
        await this.translationRepository.save(newTranslation);
      }
    }
  }

  async findTranslationByAnyLanguage(word: string): Promise<Translation | null> {
    // Search for the word in any language column
    const query = this.translationRepository
      .createQueryBuilder('translation')
      .where('translation.cs = :word', { word })
      .orWhere('translation.de = :word', { word })
      .orWhere('translation.el = :word', { word })
      .orWhere('translation.en = :word', { word })
      .orWhere('translation.es = :word', { word })
      .orWhere('translation.fi = :word', { word })
      .orWhere('translation.fr = :word', { word })
      .orWhere('translation.he = :word', { word })
      .orWhere('translation.hi = :word', { word })
      .orWhere('translation.it = :word', { word })
      .orWhere('translation.nl = :word', { word })
      .orWhere('translation.no = :word', { word })
      .orWhere('translation.pl = :word', { word })
      .orWhere('translation.pt = :word', { word })
      .orWhere('translation.ru = :word', { word })
      .orWhere('translation.sv = :word', { word })
      .orWhere('translation.th = :word', { word })
      .orWhere('translation.uk = :word', { word })
      .orWhere('translation.vi = :word', { word });

    return query.getOne();
  }
}
