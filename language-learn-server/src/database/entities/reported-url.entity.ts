import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('reported_urls')
export class ReportedUrl {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  url: string;

  @Column({ default: 1 })
  count: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
