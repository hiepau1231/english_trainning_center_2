import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Teacher } from '../../teachers/entities/teacher.entity';

export enum AvailabilityStatus {
    AVAILABLE = 'available',
    BUSY = 'busy',
    PREFERRED = 'preferred'
}

export enum RepeatPattern {
    WEEKLY = 'weekly',
    ONCE = 'once'
}

@Entity('teacher_availability')
export class TeacherAvailability {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ name: 'teacher_id' })
    teacherId: number;

    @ManyToOne(() => Teacher, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'teacher_id' })
    teacher: Teacher;

    @Column({ name: 'day_of_week', type: 'tinyint' })
    dayOfWeek: number;

    @Column({ name: 'start_time', type: 'time' })
    startTime: string;

    @Column({ name: 'end_time', type: 'time' })
    endTime: string;

    @Column({
        type: 'enum',
        enum: AvailabilityStatus,
        default: AvailabilityStatus.AVAILABLE
    })
    status: AvailabilityStatus;

    @Column({
        name: 'repeat_pattern',
        type: 'enum',
        enum: RepeatPattern,
        default: RepeatPattern.WEEKLY
    })
    repeatPattern: RepeatPattern;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;
}