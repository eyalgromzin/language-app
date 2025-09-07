import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, OneToMany, CreateDateColumn, UpdateDateColumn, Unique } from 'typeorm';
import { Language } from './language.entity';
import { BabyStepItem } from './baby-step-item.entity';

@Entity('baby_steps')
@Unique(['stepId', 'languageId'])
export class BabyStep {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  stepId: string;

  @Column()
  title: string;

  @Column({ nullable: true })
  emoji: string;

  @Column({ name: 'language_id' })
  languageId: number;

  @Column({ nullable: true })
  languageName: string;

  @Column({ type: 'text', nullable: true })
  overview: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => Language, language => language.babySteps)
  @JoinColumn({ name: 'language_id' })
  language: Language;

  @OneToMany(() => BabyStepItem, babyStepItem => babyStepItem.babyStep)
  items: BabyStepItem[];
}
