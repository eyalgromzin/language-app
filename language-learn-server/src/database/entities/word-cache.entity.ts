import { Entity, PrimaryGeneratedColumn, Column, Index, CreateDateColumn } from 'typeorm';

@Entity('word_cache')
@Index(['word'], { unique: true })
export class WordCacheEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 200 })
  word: string;

  @CreateDateColumn()
  createdAt: Date;
}
