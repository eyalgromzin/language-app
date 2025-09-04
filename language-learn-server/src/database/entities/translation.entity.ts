import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('translations')
export class Translation {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'text', nullable: true })
  cs: string;

  @Column({ type: 'text', nullable: true })
  de: string;

  @Column({ type: 'text', nullable: true })
  el: string;

  @Column({ type: 'text', nullable: true })
  en: string;

  @Column({ type: 'text', nullable: true })
  es: string;

  @Column({ type: 'text', nullable: true })
  fi: string;

  @Column({ type: 'text', nullable: true })
  fr: string;

  @Column({ type: 'text', nullable: true })
  he: string;

  @Column({ type: 'text', nullable: true })
  hi: string;

  @Column({ type: 'text', nullable: true })
  it: string;

  @Column({ type: 'text', nullable: true })
  nl: string;

  @Column({ type: 'text', nullable: true })
  no: string;

  @Column({ type: 'text', nullable: true })
  pl: string;

  @Column({ type: 'text', nullable: true })
  pt: string;

  @Column({ type: 'text', nullable: true })
  ru: string;

  @Column({ type: 'text', nullable: true })
  sv: string;

  @Column({ type: 'text', nullable: true })
  th: string;

  @Column({ type: 'text', nullable: true })
  uk: string;

  @Column({ type: 'text', nullable: true })
  vi: string;
}
