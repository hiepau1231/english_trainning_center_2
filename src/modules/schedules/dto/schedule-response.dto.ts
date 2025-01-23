import { ClassSchedule } from '../entities/class-schedule.entity';
import { ScheduleConflict } from '../repositories/class-schedule.repository';

export class ScheduleResponseDto {
    success: boolean;
    data?: {
        id: number;
        classId: number;
        teacherId: number;
        roomId: number;
        dayOfWeek: number;
        startTime: string;
        endTime: string;
        startDate: Date;
        endDate: Date;
        createdAt: Date;
        updatedAt: Date;
    };
    conflicts?: {
        type: 'teacher' | 'room' | 'class';
        entityId: number;
        conflictDetails: {
            existingSchedule: {
                dayOfWeek?: number;
                startTime?: string;
                endTime?: string;
                startDate?: Date;
                endDate?: Date;
            };
            requestedSchedule: {
                dayOfWeek: number;
                startTime: string;
                endTime: string;
                startDate: Date;
                endDate: Date;
            };
        };
    }[];
    message?: string;

    static fromSchedule(schedule: ClassSchedule): ScheduleResponseDto {
        const response = new ScheduleResponseDto();
        response.success = true;
        response.data = {
            id: schedule.id,
            classId: schedule.classId,
            teacherId: schedule.teacherId,
            roomId: schedule.roomId,
            dayOfWeek: schedule.dayOfWeek,
            startTime: schedule.startTime,
            endTime: schedule.endTime,
            startDate: schedule.startDate,
            endDate: schedule.endDate,
            createdAt: schedule.createdAt,
            updatedAt: schedule.updatedAt
        };
        return response;
    }

    static fromConflicts(conflicts: ScheduleConflict[]): ScheduleResponseDto {
        const response = new ScheduleResponseDto();
        response.success = false;
        response.conflicts = conflicts.map(conflict => ({
            type: conflict.type,
            entityId: conflict.entityId,
            conflictDetails: {
                existingSchedule: conflict.existingSchedule ? {
                    dayOfWeek: conflict.existingSchedule.dayOfWeek,
                    startTime: conflict.existingSchedule.startTime,
                    endTime: conflict.existingSchedule.endTime,
                    startDate: conflict.existingSchedule.startDate,
                    endDate: conflict.existingSchedule.endDate
                } : null,
                requestedSchedule: {
                    dayOfWeek: conflict.requestedSlot.dayOfWeek,
                    startTime: conflict.requestedSlot.startTime,
                    endTime: conflict.requestedSlot.endTime,
                    startDate: conflict.requestedSlot.startDate,
                    endDate: conflict.requestedSlot.endDate
                }
            }
        }));
        response.message = 'Lịch học bị xung đột';
        return response;
    }
}

export class AvailableSlotsResponseDto {
    success: boolean;
    data: {
        teacherId: number;
        roomId: number;
        slot: {
            dayOfWeek: number;
            startTime: string;
            endTime: string;
            startDate: Date;
            endDate: Date;
        };
        score: number;
    }[];
    message?: string;

    static fromSuggestions(suggestions: any[]): AvailableSlotsResponseDto {
        const response = new AvailableSlotsResponseDto();
        response.success = true;
        response.data = suggestions.map(suggestion => ({
            teacherId: suggestion.teacherId,
            roomId: suggestion.roomId,
            slot: {
                dayOfWeek: suggestion.timeSlot.dayOfWeek,
                startTime: suggestion.timeSlot.startTime,
                endTime: suggestion.timeSlot.endTime,
                startDate: suggestion.timeSlot.startDate,
                endDate: suggestion.timeSlot.endDate
            },
            score: suggestion.score
        }));
        return response;
    }
}