import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { ItemType } from './item-type.entity';
import { Level } from './level.entity';
import { Language } from './language.entity';
import { Media } from './media.entity';

@Entity('library_items')
export class LibraryItem {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  url: string;

  @Column()
  name: string;

  @Column({ name: 'language_id' })
  languageId: number;

  @Column({ name: 'type_id' })
  typeId: number;

  @Column({ name: 'level_id' })
  levelId: number;

  @Column({ name: 'media_id' })
  mediaId: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => Language, language => language.libraryItems)
  @JoinColumn({ name: 'language_id' })
  language: Language;

  @ManyToOne(() => ItemType, itemType => itemType.libraryItems)
  @JoinColumn({ name: 'type_id' })
  itemType: ItemType;

  @ManyToOne(() => Level, level => level.libraryItems)
  @JoinColumn({ name: 'level_id' })
  level: Level;

  @ManyToOne(() => Media, media => media.libraryItems)
  @JoinColumn({ name: 'media_id' })
  media: Media;
}
