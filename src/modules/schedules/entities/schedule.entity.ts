import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  ManyToMany,
  JoinTable,
} from 'typeorm';
import { Classroom } from '../../rooms/entities/classroom.entity';
import { Class } from 'src/modules/classes/entities/class.entity';
import { Shift } from 'src/modules/shifts/entities/shift.entity';

@Entity('schedules')
export class Schedule {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'date', nullable: true })
  schedule_date: Date;

  @ManyToOne(() => Classroom, (classroom) => classroom.schedules)
  classroom: Classroom;

  @ManyToMany(() => Class)
  @JoinTable({
    name: 'class_schedules',
    joinColumn: { name: 'schedule_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'class_id', referencedColumnName: 'id' },
  })
  classes: Class[];

  @ManyToMany(() => Shift)
  @JoinTable({
    name: 'schedule_shifts',
    joinColumn: { name: 'schedule_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'shift_id', referencedColumnName: 'id' },
  })
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
