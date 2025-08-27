import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';
import { Language } from './language.entity';

@Entity('now_playing')
@Index(['languageId', 'updatedAt'], { unique: false })
@Index(['url'], { unique: true })
export class NowPlaying {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  url: string;

  @Column()
  title: string;

  @Column({ nullable: true })
  description: string;

  @Column({ nullable: true })
  thumbnailUrl: string;

  @Column({ nullable: true })
  length: string;

  @Column()
  languageId: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => Language, language => language.nowPlaying)
  @JoinColumn({ name: 'languageId' })
  language: Language;
}
