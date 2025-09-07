import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { BabyStep } from './baby-step.entity';

@Entity('baby_step_items')
export class BabyStepItem {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  itemId: string;

  @Column()
  type: string;

  @Column({ type: 'text' })
  text: string;

  @Column()
  practiceType: string;

  @Column({ name: 'baby_step_id' })
  babyStepId: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => BabyStep, babyStep => babyStep.items)
  @JoinColumn({ name: 'baby_step_id' })
  babyStep: BabyStep;
}
