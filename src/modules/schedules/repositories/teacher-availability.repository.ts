import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Repository, In, LessThanOrEqual, MoreThanOrEqual, DeepPartial } from 'typeorm';
import { BaseRepository } from '../../../common/repositories/base.repository';
import { TeacherAvailability, AvailabilityStatus, RepeatPattern } from '../entities/teacher-availability.entity';

export interface TimeSlot {
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    date?: Date;
}

export interface AvailabilityConflict {
    teacherId: number;
    existingSlot: TimeSlot;
    requestedSlot: TimeSlot;
}

@Injectable()
export class TeacherAvailabilityRepository extends BaseRepository<TeacherAvailability> {
    constructor(
        @InjectRepository(TeacherAvailability)
        private readonly availabilityRepository: Repository<TeacherAvailability>
    ) {
        super(availabilityRepository);
    }

    /**
     * Tìm danh sách giáo viên có sẵn trong khung giờ cụ thể
     */
    async findAvailableTeachers(timeSlot: TimeSlot): Promise<number[]> {
        const query = this.availabilityRepository
            .createQueryBuilder('availability')
            .select('DISTINCT availability.teacher_id')
            .where('availability.day_of_week = :dayOfWeek', { dayOfWeek: timeSlot.dayOfWeek })
            .andWhere('availability.start_time <= :startTime', { startTime: timeSlot.startTime })
            .andWhere('availability.end_time >= :endTime', { endTime: timeSlot.endTime })
            .andWhere('availability.status = :status', { status: AvailabilityStatus.AVAILABLE });

        if (timeSlot.date) {
            query.andWhere(
                '(availability.repeat_pattern = :weekly OR (availability.repeat_pattern = :once AND DATE(availability.created_at) = :date))',
                { 
                    weekly: RepeatPattern.WEEKLY,
                    once: RepeatPattern.ONCE,
                    date: timeSlot.date 
                }
            );
        }

        const result = await query.getRawMany();
        return result.map(row => row.teacher_id);
    }

    /**
     * Kiểm tra xung đột lịch của giáo viên
     */
    async checkConflicts(teacherId: number, timeSlot: TimeSlot): Promise<AvailabilityConflict[]> {
        const conflicts = await this.availabilityRepository.find({
            where: {
                teacherId,
                dayOfWeek: timeSlot.dayOfWeek,
                status: AvailabilityStatus.BUSY,
                startTime: LessThanOrEqual(timeSlot.endTime),
                endTime: MoreThanOrEqual(timeSlot.startTime)
            }
        });

        return conflicts.map(conflict => ({
            teacherId,
            existingSlot: {
                dayOfWeek: conflict.dayOfWeek,
                startTime: conflict.startTime,
                endTime: conflict.endTime
            },
            requestedSlot: timeSlot
        }));
    }

    /**
     * Cập nhật khả dụng của giáo viên với nhiều khung giờ
     */
    async updateAvailability(
        teacherId: number, 
        slots: TimeSlot[], 
        status: AvailabilityStatus = AvailabilityStatus.AVAILABLE
    ): Promise<TeacherAvailability[]> {
        const availabilities: DeepPartial<TeacherAvailability>[] = slots.map(slot => ({
            teacherId,
            dayOfWeek: slot.dayOfWeek,
            startTime: slot.startTime,
            endTime: slot.endTime,
            status,
            repeatPattern: slot.date ? RepeatPattern.ONCE : RepeatPattern.WEEKLY
        }));

        return this.availabilityRepository.save(availabilities);
    }

    /**
     * Xóa tất cả khả dụng của giáo viên trong các ngày cụ thể
     */
    async clearAvailability(teacherId: number, daysOfWeek: number[]): Promise<void> {
        await this.availabilityRepository.delete({
            teacherId,
            dayOfWeek: In(daysOfWeek)
        });
    }

    /**
     * Lấy tất cả khả dụng của giáo viên
     */
    async getTeacherAvailability(
        teacherId: number, 
        startDate?: Date, 
        endDate?: Date
    ): Promise<TeacherAvailability[]> {
        const query = this.availabilityRepository
            .createQueryBuilder('availability')
            .where('availability.teacher_id = :teacherId', { teacherId });

        if (startDate && endDate) {
            query.andWhere(
                '(availability.repeat_pattern = :weekly OR (availability.repeat_pattern = :once AND DATE(availability.created_at) BETWEEN :startDate AND :endDate))',
                { 
                    weekly: RepeatPattern.WEEKLY,
                    once: RepeatPattern.ONCE,
                    startDate, 
                    endDate 
                }
            );
        }

        return query.getMany();
    }
}