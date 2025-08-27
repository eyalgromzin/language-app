import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
// @ts-ignore
import { LibraryItem } from './library-item.entity';

@Entity('languages')
export class Language {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  name: string;

  @Column({ unique: true })
  symbol: string;

  @OneToMany(() => LibraryItem, (libraryItem: LibraryItem) => libraryItem.language)
  libraryItems: LibraryItem[];
}
