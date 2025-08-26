import { Entity, PrimaryGeneratedColumn, Column, Index, CreateDateColumn } from 'typeorm';

@Entity('video_cache')
@Index(['language'], { unique: true })
export class VideoCacheEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 10 })
  language: string;

  @Column({ type: 'varchar', length: 200 })
  query: string;

  @Column({ type: 'json' })
  results: any[];

  @CreateDateColumn()
  createdAt: Date;
}
