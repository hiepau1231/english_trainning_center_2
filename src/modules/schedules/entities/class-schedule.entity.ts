import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Class } from '@modules/classes/entities/class.entity';
import { Teacher } from '@modules/teachers/entities/teacher.entity';
import { Classroom } from '@modules/rooms/entities/classroom.entity';

@Entity('class_schedules')
export class ClassSchedule {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ name: 'class_id' })
    classId: number;

    @ManyToOne(() => Class, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'class_id' })
    class: Class;

    @Column({ name: 'room_id' })
    roomId: number;

    @ManyToOne(() => Classroom)
    @JoinColumn({ name: 'room_id' })
    room: Classroom;

    @Column({ name: 'teacher_id' })
    teacherId: number;

    @ManyToOne(() => Teacher, { onDelete: 'RESTRICT' })
    @JoinColumn({ name: 'teacher_id' })
    teacher: Teacher;

    @Column({ name: 'day_of_week', type: 'tinyint', comment: '0-6 (Sunday-Saturday)' })
    dayOfWeek: number;

    @Column({ name: 'start_time', type: 'time' })
    startTime: string;

    @Column({ name: 'end_time', type: 'time' })
    endTime: string;

    @Column({ name: 'start_date', type: 'date' })
    startDate: Date;

    @Column({ name: 'end_date', type: 'date' })
    endDate: Date;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;

    /**
     * Check if a specific date falls within the schedule period
     */
    isDateInSchedule(date: Date | null | undefined): boolean {
        if (!date) {
            throw new Error('Date cannot be null or undefined');
        }

        if (!(date instanceof Date) || isNaN(date.getTime())) {
            throw new Error('Invalid date input');
        }

        if (!(this.startDate instanceof Date) || !(this.endDate instanceof Date)) {
            throw new Error('Schedule dates are not properly initialized');
        }

        // Normalize dates to remove time component for comparison
        const normalizedDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        const normalizedStart = new Date(this.startDate.getFullYear(), this.startDate.getMonth(), this.startDate.getDate());
        const normalizedEnd = new Date(this.endDate.getFullYear(), this.endDate.getMonth(), this.endDate.getDate());

        return normalizedDate >= normalizedStart && normalizedDate <= normalizedEnd;
    }

    /**
     * Check for conflict with another schedule
     */
    hasConflictWith(other: ClassSchedule): boolean {
        if (!other) {
            throw new Error('Cannot check conflict with null or undefined schedule');
        }

        // Check date overlap
        const hasDateOverlap = !(
            this.endDate < other.startDate ||
            this.startDate > other.endDate
        );

        if (!hasDateOverlap) return false;

        // Check day of week
        if (this.dayOfWeek !== other.dayOfWeek) return false;

        // Check time overlap
        const thisStart = new Date(`1970-01-01T${this.startTime}`);
        const thisEnd = new Date(`1970-01-01T${this.endTime}`);
        const otherStart = new Date(`1970-01-01T${other.startTime}`);
        const otherEnd = new Date(`1970-01-01T${other.endTime}`);

        return !(thisEnd <= otherStart || thisStart >= otherEnd);
    }
}