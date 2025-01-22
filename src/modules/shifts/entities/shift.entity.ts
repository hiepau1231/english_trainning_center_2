import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  ManyToMany,
} from 'typeorm';
import { Schedule } from '../../schedules/entities/schedule.entity';
import { Class } from 'src/modules/classes/entities/class.entity';

@Entity('shifts')
export class Shift {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  teaching_shift: string;

  @ManyToOne(() => Class, (class_) => class_.shifts)
  class: Class;

  @ManyToMany(() => Schedule, (schedule) => schedule.shifts)
  schedules: Schedule[];

  @Column({ default: false })
  is_deleted: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @Column({ type: 'timestamp', nullable: true })
  deleted_at: Date;
}
