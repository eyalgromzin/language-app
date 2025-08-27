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

  @Column({ name: 'thumbnail_url', nullable: true })
  thumbnailUrl: string;

  @Column({ nullable: true })
  length: string;

  @Column({ name: 'language_id' })
  languageId: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => Language, language => language.nowPlaying)
  @JoinColumn({ name: 'language_id' })
  language: Language;
}
