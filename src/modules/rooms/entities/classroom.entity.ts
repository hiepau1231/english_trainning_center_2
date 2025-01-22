import { Class } from 'src/modules/classes/entities/class.entity';
import { Schedule } from 'src/modules/schedules/entities/schedule.entity';
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

  @Column({ nullable: true })
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
