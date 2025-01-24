import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Repository, DeepPartial, LessThanOrEqual, MoreThanOrEqual } from 'typeorm';
import { BaseRepository } from '@common/repositories/base.repository';
import { ClassSchedule } from '@modules/schedules/entities/class-schedule.entity';

export interface ClassTimeSlot {
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    startDate: Date;
    endDate: Date;
}

export interface ScheduleConflict {
    type: 'teacher' | 'room' | 'class';
    entityId: number;
    existingSchedule: ClassSchedule;
    requestedSlot: ClassTimeSlot;
}

@Injectable()
export class ClassScheduleRepository extends BaseRepository<ClassSchedule> {
    constructor(
        @InjectRepository(ClassSchedule)
        private readonly classScheduleRepository: Repository<ClassSchedule>
    ) {
        super(classScheduleRepository);
    }

    /**
     * Create a new class schedule
     */
    async createSchedule(
        classId: number,
        teacherId: number,
        roomId: number,
        timeSlot: ClassTimeSlot
    ): Promise<ClassSchedule> {
        const schedule: DeepPartial<ClassSchedule> = {
            classId,
            teacherId,
            roomId,
            dayOfWeek: timeSlot.dayOfWeek,
            startTime: timeSlot.startTime,
            endTime: timeSlot.endTime,
            startDate: timeSlot.startDate,
            endDate: timeSlot.endDate
        };

        return this.classScheduleRepository.save(schedule);
    }

    /**
     * Check for schedule conflicts
     */
    async findConflicts(timeSlot: ClassTimeSlot, excludeClassId?: number): Promise<ScheduleConflict[]> {
        const conflicts = await this.classScheduleRepository
            .createQueryBuilder('schedule')
            .where('schedule.day_of_week = :dayOfWeek', { dayOfWeek: timeSlot.dayOfWeek })
            .andWhere('schedule.start_time < :endTime', { endTime: timeSlot.endTime })
            .andWhere('schedule.end_time > :startTime', { startTime: timeSlot.startTime })
            .andWhere(
                '(schedule.start_date <= :endDate AND schedule.end_date >= :startDate)',
                { startDate: timeSlot.startDate, endDate: timeSlot.endDate }
            );

        if (excludeClassId) {
            conflicts.andWhere('schedule.class_id != :excludeClassId', { excludeClassId });
        }

        const foundConflicts = await conflicts.getMany();
        
        return foundConflicts.map(conflict => {
            let type: 'teacher' | 'room' | 'class' = 'class';
            let entityId = conflict.classId;

            // Determine conflict type based on overlapping resources
            if (conflict.teacherId === timeSlot['teacherId']) {
                type = 'teacher';
                entityId = conflict.teacherId;
            } else if (conflict.roomId === timeSlot['roomId']) {
                type = 'room';
                entityId = conflict.roomId;
            }

            return {
                type,
                entityId,
                existingSchedule: conflict,
                requestedSlot: timeSlot
            };
        });
    }

    /**
     * Get class schedule
     */
    async getClassSchedule(classId: number): Promise<ClassSchedule[]> {
        return this.classScheduleRepository.find({
            where: { classId },
            order: {
                dayOfWeek: 'ASC',
                startTime: 'ASC'
            }
        });
    }

    /**
     * Get teacher schedule
     */
    async getTeacherSchedule(
        teacherId: number,
        startDate: Date,
        endDate: Date
    ): Promise<ClassSchedule[]> {
        if (!startDate || !endDate) {
            throw new Error('Start date and end date are required');
        }

        if (endDate < startDate) {
            throw new Error('End date must be after start date');
        }

        return this.classScheduleRepository.find({
            where: {
                teacherId,
                startDate: LessThanOrEqual(endDate),
                endDate: MoreThanOrEqual(startDate)
            },
            order: {
                dayOfWeek: 'ASC',
                startTime: 'ASC'
            }
        });
    }

    /**
     * Get room schedule
     */
    async getRoomSchedule(
        roomId: number,
        startDate: Date,
        endDate: Date
    ): Promise<ClassSchedule[]> {
        if (!startDate || !endDate) {
            throw new Error('Start date and end date are required');
        }

        if (endDate < startDate) {
            throw new Error('End date must be after start date');
        }

        return this.classScheduleRepository.find({
            where: {
                roomId,
                startDate: LessThanOrEqual(endDate),
                endDate: MoreThanOrEqual(startDate)
            },
            order: {
                dayOfWeek: 'ASC',
                startTime: 'ASC'
            }
        });
    }

    /**
     * Update schedule information
     */
    async updateSchedule(
        scheduleId: number,
        updates: Partial<ClassTimeSlot>
    ): Promise<ClassSchedule> {
        await this.classScheduleRepository.update(scheduleId, updates);
        return this.classScheduleRepository.findOne({ where: { id: scheduleId } });
    }

    /**
     * Delete schedule
     */
    async deleteSchedule(scheduleId: number): Promise<void> {
        await this.classScheduleRepository.delete(scheduleId);
    }

    /**
     * Find available slots for schedule suggestions
     */
    async findAvailableSlots(
        teacherId: number,
        roomId: number,
        startDate: Date,
        endDate: Date
    ): Promise<ClassTimeSlot[]> {
        if (!startDate || !endDate) {
            throw new Error('Start date and end date are required');
        }

        if (endDate < startDate) {
            throw new Error('End date must be after start date');
        }

        // Get all existing schedules for the teacher and room
        const [teacherSchedules, roomSchedules] = await Promise.all([
            this.getTeacherSchedule(teacherId, startDate, endDate),
            this.getRoomSchedule(roomId, startDate, endDate)
        ]);

        // Combine and analyze schedules to find available slots
        const availableSlots: ClassTimeSlot[] = [];
        
        // Find slots on weekdays between 8 AM and 5 PM
        for (let day = 1; day <= 5; day++) { // Monday (1) to Friday (5)
            const slot: ClassTimeSlot = {
                dayOfWeek: day,
                startTime: '08:00:00',
                endTime: '17:00:00',
                startDate,
                endDate
            };

            const hasConflicts = await this.findConflicts(slot);
            if (hasConflicts.length === 0) {
                availableSlots.push(slot);
            }
        }

        return availableSlots;
    }
}