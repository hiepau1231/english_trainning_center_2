import { Class } from 'src/modules/classes/entities/class.entity';
import { Level } from 'src/modules/levels/entities/level.entity';
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToMany,
  JoinTable,
  OneToMany,
} from 'typeorm';
import { ClassTeacher } from '../../classes/entities/class-teacher.entity';

@Entity('teachers')
export class Teacher {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  teacher_name: string;

  @Column({ nullable: true })
  email: string;

  @Column({ name: 'is_foreign', default: false })
  is_foreign: boolean;

  @Column({ name: 'is_Fulltime', default: false })
  is_Fulltime: boolean;

  @Column({ name: 'is_Parttime', default: false })
  is_Parttime: boolean;

  @Column({ nullable: true })
  phone_number: string;

  @Column({ nullable: true })
  working_type_id: number;

  @Column({ nullable: true })
  courses_level_id: number;

  @ManyToMany(() => Class)
  @JoinTable({
    name: 'class_teachers',
    joinColumn: { name: 'teacher_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'class_id', referencedColumnName: 'id' },
  })
  classes: Class[];

  @ManyToMany(() => Level)
  @JoinTable({
    name: 'teacher_level',
    joinColumn: { name: 'teacher_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'level_id', referencedColumnName: 'id' },
  })
  levels: Level[];

  @Column({ default: false })
  is_deleted: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @Column({ type: 'timestamp', nullable: true })
  deleted_at: Date;

  @OneToMany(() => ClassTeacher, (classTeacher) => classTeacher.teacher)
  classTeachers: ClassTeacher[];
}
