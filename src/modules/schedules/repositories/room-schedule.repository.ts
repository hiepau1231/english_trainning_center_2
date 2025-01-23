import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Repository, In, LessThanOrEqual, MoreThanOrEqual, DeepPartial } from 'typeorm';
import { BaseRepository } from '../../../common/repositories/base.repository';
import { RoomSchedule, RoomStatus } from '../entities/room-schedule.entity';

export interface RoomTimeSlot {
    date: Date;
    startTime: string;
    endTime: string;
}

export interface RoomConflict {
    roomId: number;
    existingSchedule: RoomTimeSlot;
    requestedSchedule: RoomTimeSlot;
}

@Injectable()
export class RoomScheduleRepository extends BaseRepository<RoomSchedule> {
    constructor(
        @InjectRepository(RoomSchedule)
        private readonly roomScheduleRepository: Repository<RoomSchedule>
    ) {
        super(roomScheduleRepository);
    }

    /**
     * Tìm phòng trống trong khung giờ cụ thể
     */
    async findAvailableRooms(timeSlot: RoomTimeSlot): Promise<number[]> {
        // Lấy danh sách các phòng đã đặt trong khung giờ này
        const bookedRooms = await this.roomScheduleRepository
            .createQueryBuilder('schedule')
            .select('DISTINCT schedule.room_id')
            .where('schedule.date = :date', { date: timeSlot.date })
            .andWhere('schedule.start_time < :endTime', { endTime: timeSlot.endTime })
            .andWhere('schedule.end_time > :startTime', { startTime: timeSlot.startTime })
            .andWhere('schedule.status = :status', { status: RoomStatus.BOOKED })
            .getRawMany();

        // Tạo subquery để loại trừ các phòng đã đặt
        const bookedRoomIds = bookedRooms.map(room => room.room_id);
        
        // Tìm tất cả phòng không nằm trong danh sách đã đặt và không bảo trì
        return this.roomScheduleRepository
            .createQueryBuilder('schedule')
            .select('DISTINCT schedule.room_id')
            .where('schedule.date = :date', { date: timeSlot.date })
            .andWhere('schedule.room_id NOT IN (:...bookedRoomIds)', { 
                bookedRoomIds: bookedRoomIds.length > 0 ? bookedRoomIds : [0] 
            })
            .andWhere('schedule.status != :maintenanceStatus', { 
                maintenanceStatus: RoomStatus.MAINTENANCE 
            })
            .getRawMany()
            .then(rooms => rooms.map(room => room.room_id));
    }

    /**
     * Kiểm tra xung đột lịch phòng học
     */
    async checkConflicts(roomId: number, timeSlot: RoomTimeSlot): Promise<RoomConflict[]> {
        const conflicts = await this.roomScheduleRepository.find({
            where: {
                roomId,
                date: timeSlot.date,
                status: RoomStatus.BOOKED,
                startTime: LessThanOrEqual(timeSlot.endTime),
                endTime: MoreThanOrEqual(timeSlot.startTime)
            }
        });

        return conflicts.map(conflict => ({
            roomId,
            existingSchedule: {
                date: conflict.date,
                startTime: conflict.startTime,
                endTime: conflict.endTime
            },
            requestedSchedule: timeSlot
        }));
    }

    /**
     * Đặt phòng cho một khung giờ
     */
    async bookRoom(roomId: number, timeSlot: RoomTimeSlot): Promise<RoomSchedule> {
        const schedule: DeepPartial<RoomSchedule> = {
            roomId,
            date: timeSlot.date,
            startTime: timeSlot.startTime,
            endTime: timeSlot.endTime,
            status: RoomStatus.BOOKED
        };

        return this.roomScheduleRepository.save(schedule);
    }

    /**
     * Hủy đặt phòng
     */
    async cancelBooking(roomId: number, timeSlot: RoomTimeSlot): Promise<void> {
        await this.roomScheduleRepository.delete({
            roomId,
            date: timeSlot.date,
            startTime: timeSlot.startTime,
            endTime: timeSlot.endTime,
            status: RoomStatus.BOOKED
        });
    }

    /**
     * Cập nhật trạng thái phòng (ví dụ: đánh dấu bảo trì)
     */
    async updateRoomStatus(
        roomId: number,
        timeSlot: RoomTimeSlot,
        status: RoomStatus
    ): Promise<RoomSchedule> {
        const schedule: DeepPartial<RoomSchedule> = {
            roomId,
            date: timeSlot.date,
            startTime: timeSlot.startTime,
            endTime: timeSlot.endTime,
            status
        };

        return this.roomScheduleRepository.save(schedule);
    }

    /**
     * Lấy lịch sử đặt phòng trong khoảng thời gian
     */
    async getRoomSchedules(
        roomId: number,
        startDate: Date,
        endDate: Date
    ): Promise<RoomSchedule[]> {
        return this.roomScheduleRepository.find({
            where: {
                roomId,
                date: Between(startDate, endDate)
            },
            order: {
                date: 'ASC',
                startTime: 'ASC'
            }
        });
    }
}