import {
  Entity,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  JoinColumn,
} from 'typeorm';
import { Class } from './class.entity';
import { Teacher } from '../../teachers/entities/teacher.entity';
import { TeacherRole } from '../enums/teacher-role.enum';

@Entity('class_teachers')
export class ClassTeacher {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  class_id: number;

  @Column()
  teacher_id: number;

  @ManyToOne(() => Class, (class_) => class_.classTeachers)
  @JoinColumn({ name: 'class_id' })
  class: Class;

  @ManyToOne(() => Teacher, (teacher) => teacher.classTeachers)
  @JoinColumn({ name: 'teacher_id' })
  teacher: Teacher;

  @Column({
    type: 'enum',
    enum: TeacherRole,
    default: TeacherRole.MAIN,
  })
  role: TeacherRole;

  @Column({ default: false })
  is_deleted: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @Column({ type: 'timestamp', nullable: true })
  deleted_at: Date;
}
