import { Injectable } from '@nestjs/common';
import { TeacherAvailabilityRepository, TimeSlot } from '../repositories/teacher-availability.repository';
import { RoomScheduleRepository, RoomTimeSlot } from '../repositories/room-schedule.repository';
import { ClassScheduleRepository, ClassTimeSlot, ScheduleConflict } from '../repositories/class-schedule.repository';
import { AvailabilityStatus } from '../entities/teacher-availability.entity';
import { RoomStatus } from '../entities/room-schedule.entity';
import { ClassSchedule } from '../entities/class-schedule.entity';

export interface ScheduleCreationParams {
    classId: number;
    teacherId: number;
    roomId: number;
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    startDate: Date;
    endDate: Date;
}

export interface ScheduleSuggestion {
    teacherId: number;
    roomId: number;
    timeSlot: ClassTimeSlot;
    score: number;
}

@Injectable()
export class SchedulingService {
    constructor(
        private readonly teacherAvailabilityRepo: TeacherAvailabilityRepository,
        private readonly roomScheduleRepo: RoomScheduleRepository,
        private readonly classScheduleRepo: ClassScheduleRepository
    ) {}

    async createClassSchedule(params: ScheduleCreationParams): Promise<[ClassSchedule, any[]]> {
        const timeSlot: ClassTimeSlot = {
            dayOfWeek: params.dayOfWeek,
            startTime: params.startTime,
            endTime: params.endTime,
            startDate: params.startDate,
            endDate: params.endDate
        };

        // Check teacher availability
        const teacherConflicts = await this.teacherAvailabilityRepo.checkConflicts(params.teacherId, {
            dayOfWeek: timeSlot.dayOfWeek,
            startTime: timeSlot.startTime,
            endTime: timeSlot.endTime
        }) || [];

        if (teacherConflicts.length > 0) {
            return [null, [{
                teacherId: params.teacherId,
                existingSlot: {
                    dayOfWeek: timeSlot.dayOfWeek,
                    startTime: timeSlot.startTime,
                    endTime: timeSlot.endTime
                },
                requestedSlot: {
                    dayOfWeek: timeSlot.dayOfWeek,
                    startTime: timeSlot.startTime,
                    endTime: timeSlot.endTime
                }
            }]];
        }

        // Check room availability
        const roomConflicts = await this.roomScheduleRepo.checkConflicts(params.roomId, {
            date: timeSlot.startDate,
            startTime: timeSlot.startTime,
            endTime: timeSlot.endTime
        }) || [];

        if (roomConflicts.length > 0) {
            return [null, [{
                roomId: params.roomId,
                existingSlot: {
                    dayOfWeek: timeSlot.dayOfWeek,
                    startTime: timeSlot.startTime,
                    endTime: timeSlot.endTime
                },
                requestedSlot: timeSlot
            }]];
        }

        // Check other class conflicts
        const classConflicts = await this.classScheduleRepo.findConflicts(timeSlot);
        if (classConflicts.length > 0) {
            return [null, classConflicts];
        }

        // If no conflicts, create the schedule
        const schedule = await this.classScheduleRepo.createSchedule(
            params.classId,
            params.teacherId,
            params.roomId,
            timeSlot
        );

        return [schedule, []];
    }

    async getClassSchedule(classId: number): Promise<ClassSchedule[]> {
        return this.classScheduleRepo.getClassSchedule(classId);
    }

    async getTeacherSchedule(
        teacherId: number,
        startDate: Date,
        endDate: Date
    ): Promise<ClassSchedule[]> {
        return this.classScheduleRepo.getTeacherSchedule(teacherId, startDate, endDate);
    }

    async getRoomSchedule(
        roomId: number,
        startDate: Date,
        endDate: Date
    ): Promise<ClassSchedule[]> {
        return this.classScheduleRepo.getRoomSchedule(roomId, startDate, endDate);
    }

    async findAvailableSlots(
        teacherId: number,
        preferredRooms: number[],
        startDate: Date,
        endDate: Date,
        preferredDays: number[] = [1, 2, 3, 4, 5]
    ): Promise<ScheduleSuggestion[]> {
        if (endDate < startDate) {
            throw new Error('End date must be after start date');
        }

        const suggestions: ScheduleSuggestion[] = [];

        const teacherAvailability = await this.teacherAvailabilityRepo.getTeacherAvailability(
            teacherId,
            startDate,
            endDate
        ) || [];

        for (const room of preferredRooms) {
            for (const day of preferredDays) {
                const standardSlots = this.getStandardTimeSlots();
                
                for (const slot of standardSlots) {
                    const timeSlot: ClassTimeSlot = {
                        dayOfWeek: day,
                        startTime: slot.startTime,
                        endTime: slot.endTime,
                        startDate,
                        endDate
                    };

                    const teacherConflicts = await this.teacherAvailabilityRepo.checkConflicts(teacherId, {
                        dayOfWeek: timeSlot.dayOfWeek,
                        startTime: timeSlot.startTime,
                        endTime: timeSlot.endTime
                    }) || [];

                    const roomConflicts = await this.roomScheduleRepo.checkConflicts(room, {
                        date: timeSlot.startDate,
                        startTime: timeSlot.startTime,
                        endTime: timeSlot.endTime
                    }) || [];

                    const classConflicts = await this.classScheduleRepo.findConflicts(timeSlot);

                    if (teacherConflicts.length === 0 && roomConflicts.length === 0 && classConflicts.length === 0) {
                        const score = this.calculateSlotScore(timeSlot, teacherAvailability);
                        suggestions.push({ teacherId, roomId: room, timeSlot, score });
                    }
                }
            }
        }

        return suggestions
            .sort((a, b) => b.score - a.score)
            .slice(0, 5);
    }

    private calculateSlotScore(timeSlot: ClassTimeSlot, teacherAvailability: any[]): number {
        let score = 0;

        const startHour = parseInt(timeSlot.startTime.split(':')[0]);
        if (startHour >= 8 && startHour <= 11) score += 2;

        if (timeSlot.dayOfWeek >= 2 && timeSlot.dayOfWeek <= 4) score += 1;

        const hasPreferredTime = teacherAvailability.some(
            avail => avail.status === AvailabilityStatus.PREFERRED &&
                    avail.dayOfWeek === timeSlot.dayOfWeek
        );
        if (hasPreferredTime) score += 3;

        return score;
    }

    private getStandardTimeSlots(): { startTime: string; endTime: string }[] {
        return [
            { startTime: '08:00:00', endTime: '09:30:00' },
            { startTime: '09:45:00', endTime: '11:15:00' },
            { startTime: '13:30:00', endTime: '15:00:00' },
            { startTime: '15:15:00', endTime: '16:45:00' }
        ];
    }

    async updateClassSchedule(
        scheduleId: number,
        updates: Partial<ScheduleCreationParams>
    ): Promise<[ClassSchedule, any[]]> {
        const currentSchedule = await this.classScheduleRepo.findOne({ where: { id: scheduleId } });
        if (!currentSchedule) {
            throw new Error('Schedule not found');
        }

        const timeSlot: ClassTimeSlot = {
            dayOfWeek: updates.dayOfWeek ?? currentSchedule.dayOfWeek,
            startTime: updates.startTime ?? currentSchedule.startTime,
            endTime: updates.endTime ?? currentSchedule.endTime,
            startDate: updates.startDate ?? currentSchedule.startDate,
            endDate: updates.endDate ?? currentSchedule.endDate
        };

        const teacherId = updates.teacherId ?? currentSchedule.teacherId;

        // Check teacher availability
        const teacherConflicts = await this.teacherAvailabilityRepo.checkConflicts(teacherId, {
            dayOfWeek: currentSchedule.dayOfWeek,
            startTime: currentSchedule.startTime,
            endTime: currentSchedule.endTime
        }) || [];

        if (teacherConflicts.length > 0) {
            return [null, [{
                teacherId,
                existingSlot: {
                    dayOfWeek: currentSchedule.dayOfWeek,
                    startTime: currentSchedule.startTime,
                    endTime: currentSchedule.endTime
                },
                requestedSlot: {
                    dayOfWeek: currentSchedule.dayOfWeek,
                    startTime: currentSchedule.startTime,
                    endTime: currentSchedule.endTime
                }
            }]];
        }

        const roomId = updates.roomId ?? currentSchedule.roomId;
        const roomConflicts = await this.roomScheduleRepo.checkConflicts(roomId, {
            date: currentSchedule.startDate,
            startTime: currentSchedule.startTime,
            endTime: currentSchedule.endTime
        });

        if (roomConflicts.length > 0) {
            return [null, [{
                roomId,
                existingSlot: {
                    dayOfWeek: currentSchedule.dayOfWeek,
                    startTime: currentSchedule.startTime,
                    endTime: currentSchedule.endTime
                },
                requestedSlot: timeSlot
            }]];
        }

        const classConflicts = await this.classScheduleRepo.findConflicts(timeSlot, currentSchedule.id);
        if (classConflicts.length > 0) {
            return [null, classConflicts];
        }

        const updatedSchedule = await this.classScheduleRepo.updateSchedule(scheduleId, timeSlot);
        return [updatedSchedule, []];
    }

    async deleteClassSchedule(scheduleId: number): Promise<void> {
        await this.classScheduleRepo.deleteSchedule(scheduleId);
    }
}