import { Entity, PrimaryGeneratedColumn, Column, Index, CreateDateColumn } from 'typeorm';

@Entity('translations')
export class TranslationEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 200 })
  @Index()
  word: string;

  @Column({ type: 'varchar', length: 200, nullable: true })
  @Index()
  cs: string;

  @Column({ type: 'varchar', length: 200, nullable: true })
  @Index()
  de: string;

  @Column({ type: 'varchar', length: 200, nullable: true })
  @Index()
  el: string;

  @Column({ type: 'varchar', length: 200, nullable: true })
  @Index()
  en: string;

  @Column({ type: 'varchar', length: 200, nullable: true })
  @Index()
  es: string;

  @Column({ type: 'varchar', length: 200, nullable: true })
  @Index()
  fi: string;

  @Column({ type: 'varchar', length: 200, nullable: true })
  @Index()
  fr: string;

  @Column({ type: 'varchar', length: 200, nullable: true })
  @Index()
  he: string;

  @Column({ type: 'varchar', length: 200, nullable: true })
  @Index()
  hi: string;

  @Column({ type: 'varchar', length: 200, nullable: true })
  @Index()
  it: string;

  @Column({ type: 'varchar', length: 200, nullable: true })
  @Index()
  nl: string;

  @Column({ type: 'varchar', length: 200, nullable: true })
  @Index()
  no: string;

  @Column({ type: 'varchar', length: 200, nullable: true })
  @Index()
  pl: string;

  @Column({ type: 'varchar', length: 200, nullable: true })
  @Index()
  pt: string;

  @Column({ type: 'varchar', length: 200, nullable: true })
  @Index()
  ru: string;

  @Column({ type: 'varchar', length: 200, nullable: true })
  @Index()
  sv: string;

  @Column({ type: 'varchar', length: 200, nullable: true })
  @Index()
  th: string;

  @Column({ type: 'varchar', length: 200, nullable: true })
  @Index()
  tr: string;

  @Column({ type: 'varchar', length: 200, nullable: true })
  @Index()
  uk: string;

  @Column({ type: 'varchar', length: 200, nullable: true })
  @Index()
  vi: string;

  @CreateDateColumn()
  createdAt: Date;

  @CreateDateColumn()
  updatedAt: Date;
}
