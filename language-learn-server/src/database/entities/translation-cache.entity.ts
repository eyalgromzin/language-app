import { Entity, PrimaryGeneratedColumn, Column, Index, CreateDateColumn } from 'typeorm';

@Entity('translation_cache')
@Index(['word', 'fromLanguage', 'toLanguage'], { unique: true })
export class TranslationCacheEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 200 })
  word: string;

  @Column({ type: 'varchar', length: 10 })
  fromLanguage: string;

  @Column({ type: 'varchar', length: 10 })
  toLanguage: string;

  @Column({ type: 'text' })
  translation: string;

  @CreateDateColumn()
  createdAt: Date;
}
