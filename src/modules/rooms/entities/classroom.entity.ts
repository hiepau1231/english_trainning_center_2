import { Class } from '@modules/classes/entities/class.entity';
import { Schedule } from '@modules/schedules/entities/schedule.entity';
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';

@Entity('classrooms')
export class Classroom {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  room_name: string;

  @Column()
  capacity: number;

  @OneToMany(() => Class, (class_) => class_.classroom)
  classes: Class[];

  @OneToMany(() => Schedule, (schedule) => schedule.classroom)
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
