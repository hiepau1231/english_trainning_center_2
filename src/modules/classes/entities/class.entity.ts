import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  ManyToMany,
  OneToMany,
  JoinTable,
} from 'typeorm';
import { Course } from '../../courses/entities/course.entity';
import { Classroom } from '../../rooms/entities/classroom.entity';
import { Schedule } from '../../schedules/entities/schedule.entity';
import { Shift } from '../../shifts/entities/shift.entity';
import { ClassTeacher } from './class-teacher.entity';

@Entity('classes')
export class Class {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  class_name: string;

  @ManyToOne(() => Course, (course) => course.classes)
  course: Course;

  @ManyToOne(() => Classroom, (classroom) => classroom.classes)
  classroom: Classroom;

  @Column({ type: 'date', nullable: true })
  start_date: Date;

  @Column({ type: 'date', nullable: true })
  end_date: Date;

  @OneToMany(() => ClassTeacher, (classTeacher) => classTeacher.class)
  classTeachers: ClassTeacher[];

  @ManyToMany(() => Schedule, (schedule) => schedule.classes)
  @JoinTable({
    name: 'class_schedules',
    joinColumn: { name: 'class_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'schedule_id', referencedColumnName: 'id' },
  })
  schedules: Schedule[];

  @OneToMany(() => Shift, (shift) => shift.class)
  shifts: Shift[];

  @Column({ default: false })
  is_deleted: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @Column({ type: 'timestamp', nullable: true })
  deleted_at: Date;
}
