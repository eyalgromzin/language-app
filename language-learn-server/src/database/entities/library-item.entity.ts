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

  @Column()
  languageId: number;

  @Column()
  typeId: number;

  @Column()
  levelId: number;

  @Column()
  mediaId: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => Language, language => language.libraryItems)
  @JoinColumn({ name: 'languageId' })
  language: Language;

  @ManyToOne(() => ItemType, itemType => itemType.libraryItems)
  @JoinColumn({ name: 'typeId' })
  itemType: ItemType;

  @ManyToOne(() => Level, level => level.libraryItems)
  @JoinColumn({ name: 'levelId' })
  level: Level;

  @ManyToOne(() => Media, media => media.libraryItems)
  @JoinColumn({ name: 'mediaId' })
  media: Media;
}
