import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
// @ts-ignore
import { LibraryItem } from './library-item.entity';

@Entity('levels')
export class Level {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  name: string;

  @OneToMany(() => LibraryItem, libraryItem => libraryItem.level)
  libraryItems: LibraryItem[];
}
