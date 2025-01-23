import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Class } from '../../classes/entities/class.entity';
import { Teacher } from '../../teachers/entities/teacher.entity';
import { Classroom } from '../../rooms/entities/classroom.entity';

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

    // Utility methods for scheduling validation
    
    /**
     * Kiểm tra xem một ngày cụ thể có nằm trong khoảng lịch học không
     */
    isDateInSchedule(date: Date): boolean {
        return date >= this.startDate && date <= this.endDate;
    }

    /**
     * Kiểm tra xung đột với một lịch học khác
     */
    hasConflictWith(other: ClassSchedule): boolean {
        // Kiểm tra ngày
        const hasDateOverlap = !(
            this.endDate < other.startDate ||
            this.startDate > other.endDate
        );

        if (!hasDateOverlap) return false;

        // Kiểm tra thứ trong tuần
        if (this.dayOfWeek !== other.dayOfWeek) return false;

        // Kiểm tra thời gian
        const thisStart = new Date(`1970-01-01T${this.startTime}`);
        const thisEnd = new Date(`1970-01-01T${this.endTime}`);
        const otherStart = new Date(`1970-01-01T${other.startTime}`);
        const otherEnd = new Date(`1970-01-01T${other.endTime}`);

        return !(thisEnd <= otherStart || thisStart >= otherEnd);
    }
}