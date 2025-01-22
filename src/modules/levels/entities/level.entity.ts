import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToMany,
} from 'typeorm';
import { Teacher } from '../../teachers/entities/teacher.entity';

@Entity('level')
export class Level {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  level_name: string;

  @ManyToMany(() => Teacher, (teacher) => teacher.levels)
  teachers: Teacher[];

  @Column({ default: false })
  is_deleted: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @Column({ type: 'timestamp', nullable: true })
  deleted_at: Date;
}
