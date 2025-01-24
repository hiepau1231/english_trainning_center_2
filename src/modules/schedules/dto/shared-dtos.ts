import { IsInt, IsString, IsDateString, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * Common interface for schedule time slots
 */
export interface TimeSlot {
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    startDate: Date;
    endDate: Date;
}

/**
 * Reusable time slot validation class
 */
export class TimeSlotValidation {
    @IsInt()
    @Min(0)
    @Max(6)
    dayOfWeek: number;

    @IsString()
    startTime: string;

    @IsString()
    endTime: string;

    @IsDateString()
    @Type(() => Date)
    startDate: Date;

    @IsDateString()
    @Type(() => Date)
    endDate: Date;
}

/**
 * Schedule conflict types
 */
export type ConflictType = 'teacher' | 'room' | 'class';

export interface ConflictDetails {
    existingSchedule?: Partial<TimeSlot>;
    requestedSchedule: TimeSlot;
}

export interface ScheduleConflict {
    type: ConflictType;
    entityId: number;
    conflictDetails: ConflictDetails;
}

/**
 * Available slot suggestion interface
 */
export interface SlotSuggestion {
    teacherId: number;
    roomId: number;
    timeSlot: TimeSlot;
    score: number;
}

/**
 * Base response interface
 */
export interface BaseResponse<T> {
    success: boolean;
    data?: T;
    message?: string;
}