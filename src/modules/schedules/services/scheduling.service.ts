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
    score: number; // Higher is better
}

@Injectable()
export class SchedulingService {
    constructor(
        private readonly teacherAvailabilityRepo: TeacherAvailabilityRepository,
        private readonly roomScheduleRepo: RoomScheduleRepository,
        private readonly classScheduleRepo: ClassScheduleRepository
    ) {}

    /**
     * Tạo lịch học mới
     */
    async createClassSchedule(params: ScheduleCreationParams): Promise<[ClassSchedule, ScheduleConflict[]]> {
        const timeSlot: ClassTimeSlot = {
            dayOfWeek: params.dayOfWeek,
            startTime: params.startTime,
            endTime: params.endTime,
            startDate: params.startDate,
            endDate: params.endDate
        };

        const conflicts = await this.checkScheduleConflicts(
            params.teacherId,
            params.roomId,
            timeSlot
        );

        if (conflicts.length === 0) {
            const schedule = await this.classScheduleRepo.createSchedule(
                params.classId,
                params.teacherId,
                params.roomId,
                timeSlot
            );
            return [schedule, []];
        }

        return [null, conflicts];
    }

    /**
     * Lấy lịch học của lớp
     */
    async getClassSchedule(classId: number): Promise<ClassSchedule[]> {
        return this.classScheduleRepo.getClassSchedule(classId);
    }

    /**
     * Lấy lịch dạy của giáo viên
     */
    async getTeacherSchedule(
        teacherId: number,
        startDate: Date,
        endDate: Date
    ): Promise<ClassSchedule[]> {
        return this.classScheduleRepo.getTeacherSchedule(teacherId, startDate, endDate);
    }

    /**
     * Lấy lịch sử dụng phòng học
     */
    async getRoomSchedule(
        roomId: number,
        startDate: Date,
        endDate: Date
    ): Promise<ClassSchedule[]> {
        return this.classScheduleRepo.getRoomSchedule(roomId, startDate, endDate);
    }

    /**
     * Kiểm tra xung đột lịch
     */
    async checkScheduleConflicts(
        teacherId: number,
        roomId: number,
        timeSlot: ClassTimeSlot
    ): Promise<ScheduleConflict[]> {
        const conflicts: ScheduleConflict[] = [];

        // Kiểm tra khả dụng giáo viên
        const teacherConflicts = await this.teacherAvailabilityRepo.checkConflicts(teacherId, {
            dayOfWeek: timeSlot.dayOfWeek,
            startTime: timeSlot.startTime,
            endTime: timeSlot.endTime
        });

        if (teacherConflicts.length > 0) {
            conflicts.push({
                type: 'teacher',
                entityId: teacherId,
                existingSchedule: null,
                requestedSlot: timeSlot
            });
        }

        // Kiểm tra phòng học
        const roomConflicts = await this.roomScheduleRepo.checkConflicts(roomId, {
            date: timeSlot.startDate, // Simplified - should check all dates
            startTime: timeSlot.startTime,
            endTime: timeSlot.endTime
        });

        if (roomConflicts.length > 0) {
            conflicts.push({
                type: 'room',
                entityId: roomId,
                existingSchedule: null,
                requestedSlot: timeSlot
            });
        }

        // Kiểm tra xung đột với các lớp khác
        const classConflicts = await this.classScheduleRepo.findConflicts(timeSlot);
        conflicts.push(...classConflicts);

        return conflicts;
    }

    /**
     * Tìm slots trống phù hợp
     */
    async findAvailableSlots(
        teacherId: number,
        preferredRooms: number[],
        startDate: Date,
        endDate: Date,
        preferredDays: number[] = [1, 2, 3, 4, 5] // Mon-Fri by default
    ): Promise<ScheduleSuggestion[]> {
        const suggestions: ScheduleSuggestion[] = [];

        // Lấy khả dụng của giáo viên
        const teacherAvailability = await this.teacherAvailabilityRepo.getTeacherAvailability(
            teacherId,
            startDate,
            endDate
        );

        for (const room of preferredRooms) {
            // Với mỗi ngày trong tuần được ưu tiên
            for (const day of preferredDays) {
                // Kiểm tra các khung giờ chuẩn (ví dụ: 8:00-9:30, 9:45-11:15, etc.)
                const standardSlots = this.getStandardTimeSlots();
                
                for (const slot of standardSlots) {
                    const timeSlot: ClassTimeSlot = {
                        dayOfWeek: day,
                        startTime: slot.startTime,
                        endTime: slot.endTime,
                        startDate,
                        endDate
                    };

                    const conflicts = await this.checkScheduleConflicts(
                        teacherId,
                        room,
                        timeSlot
                    );

                    if (conflicts.length === 0) {
                        // Tính điểm cho slot này
                        const score = this.calculateSlotScore(timeSlot, teacherAvailability);
                        
                        suggestions.push({
                            teacherId,
                            roomId: room,
                            timeSlot,
                            score
                        });
                    }
                }
            }
        }

        // Sắp xếp theo điểm và giới hạn số lượng đề xuất
        return suggestions
            .sort((a, b) => b.score - a.score)
            .slice(0, 5);
    }

    /**
     * Tính điểm cho một slot dựa trên các tiêu chí
     */
    private calculateSlotScore(timeSlot: ClassTimeSlot, teacherAvailability: any[]): number {
        let score = 0;

        // Ưu tiên slot trong khung giờ vàng (8:00-11:00)
        const startHour = parseInt(timeSlot.startTime.split(':')[0]);
        if (startHour >= 8 && startHour <= 11) score += 2;

        // Ưu tiên các ngày giữa tuần
        if (timeSlot.dayOfWeek >= 2 && timeSlot.dayOfWeek <= 4) score += 1;

        // Ưu tiên slot trùng với preferred time của giáo viên
        const hasPreferredTime = teacherAvailability.some(
            avail => avail.status === AvailabilityStatus.PREFERRED &&
                    avail.dayOfWeek === timeSlot.dayOfWeek
        );
        if (hasPreferredTime) score += 3;

        return score;
    }

    /**
     * Lấy danh sách các khung giờ chuẩn
     */
    private getStandardTimeSlots(): { startTime: string; endTime: string }[] {
        return [
            { startTime: '08:00:00', endTime: '09:30:00' },
            { startTime: '09:45:00', endTime: '11:15:00' },
            { startTime: '13:30:00', endTime: '15:00:00' },
            { startTime: '15:15:00', endTime: '16:45:00' }
        ];
    }

    /**
     * Cập nhật lịch học
     */
    async updateClassSchedule(
        scheduleId: number,
        updates: Partial<ScheduleCreationParams>
    ): Promise<[ClassSchedule, ScheduleConflict[]]> {
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

        const conflicts = await this.checkScheduleConflicts(
            updates.teacherId ?? currentSchedule.teacherId,
            updates.roomId ?? currentSchedule.roomId,
            timeSlot
        );

        if (conflicts.length === 0) {
            const updatedSchedule = await this.classScheduleRepo.updateSchedule(
                scheduleId,
                timeSlot
            );
            return [updatedSchedule, []];
        }

        return [null, conflicts];
    }

    /**
     * Xóa lịch học
     */
    async deleteClassSchedule(scheduleId: number): Promise<void> {
        await this.classScheduleRepo.deleteSchedule(scheduleId);
    }
}