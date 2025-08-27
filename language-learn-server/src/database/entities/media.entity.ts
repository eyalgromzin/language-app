import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { LibraryItem } from './library-item.entity.js';

@Entity('media')
export class Media {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  name: string;

  @OneToMany(() => LibraryItem, libraryItem => libraryItem.media)
  libraryItems: LibraryItem[];
}
