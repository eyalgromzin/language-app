import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
// @ts-ignore
import { LibraryItem } from './library-item.entity';

@Entity('item_types')
export class ItemType {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  name: string;

  @OneToMany(() => LibraryItem, libraryItem => libraryItem.itemType)
  libraryItems: LibraryItem[];
}
