import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
// @ts-ignore
import { LibraryItem } from './library-item.entity';
// @ts-ignore
import { NowPlaying } from './now-playing.entity';
// @ts-ignore
import { BabyStep } from './baby-step.entity';

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

  @OneToMany(() => NowPlaying, (nowPlaying: NowPlaying) => nowPlaying.language)
  nowPlaying: NowPlaying[];

  @OneToMany(() => BabyStep, (babyStep: BabyStep) => babyStep.language)
  babySteps: BabyStep[];
}
