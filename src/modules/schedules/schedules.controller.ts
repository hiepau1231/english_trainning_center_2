import { Controller, Get, Post, Put, Delete, Body, Param, Query, ParseIntPipe } from '@nestjs/common';
import { SchedulingService } from './services/scheduling.service';
import { CreateScheduleDto } from './dto/create-schedule.dto';
import { UpdateScheduleDto } from './dto/update-schedule.dto';
import { ScheduleResponseDto, AvailableSlotsResponseDto } from './dto/schedule-response.dto';

@Controller('schedules')
export class SchedulesController {
    constructor(private readonly schedulingService: SchedulingService) {}

    @Post('class')
    async createClassSchedule(
        @Body() createScheduleDto: CreateScheduleDto
    ): Promise<ScheduleResponseDto> {
        const [schedule, conflicts] = await this.schedulingService.createClassSchedule(createScheduleDto);
        
        if (schedule) {
            return ScheduleResponseDto.fromSchedule(schedule);
        }
        return ScheduleResponseDto.fromConflicts(conflicts);
    }

    @Get('available-slots')
    async findAvailableSlots(
        @Query('teacherId', ParseIntPipe) teacherId: number,
        @Query('rooms') rooms: string, // comma-separated room IDs
        @Query('startDate') startDate: string,
        @Query('endDate') endDate: string,
        @Query('preferredDays') preferredDays?: string // comma-separated days (0-6)
    ): Promise<AvailableSlotsResponseDto> {
        const roomIds = rooms.split(',').map(id => parseInt(id));
        const days = preferredDays ? 
            preferredDays.split(',').map(day => parseInt(day)) : 
            [1, 2, 3, 4, 5]; // Mặc định Thứ 2 - Thứ 6

        const suggestions = await this.schedulingService.findAvailableSlots(
            teacherId,
            roomIds,
            new Date(startDate),
            new Date(endDate),
            days
        );

        return AvailableSlotsResponseDto.fromSuggestions(suggestions);
    }

    @Get('class/:classId')
    async getClassSchedule(
        @Param('classId', ParseIntPipe) classId: number
    ): Promise<ScheduleResponseDto> {
        const schedules = await this.schedulingService.getClassSchedule(classId);
        if (schedules.length > 0) {
            const response = new ScheduleResponseDto();
            response.success = true;
            response.data = schedules[0];
            return response;
        }
        
        const response = new ScheduleResponseDto();
        response.success = false;
        response.message = 'Không tìm thấy lịch học cho lớp này';
        return response;
    }

    @Get('teacher/:teacherId')
    async getTeacherSchedule(
        @Param('teacherId', ParseIntPipe) teacherId: number,
        @Query('startDate') startDate: string,
        @Query('endDate') endDate: string
    ): Promise<ScheduleResponseDto> {
        const schedules = await this.schedulingService.getTeacherSchedule(
            teacherId,
            new Date(startDate),
            new Date(endDate)
        );

        const response = new ScheduleResponseDto();
        response.success = true;
        response.data = schedules[0]; // Return first schedule if exists
        if (!schedules.length) {
            response.success = false;
            response.message = 'Không tìm thấy lịch dạy cho giáo viên này';
        }
        return response;
    }

    @Get('room/:roomId')
    async getRoomSchedule(
        @Param('roomId', ParseIntPipe) roomId: number,
        @Query('startDate') startDate: string,
        @Query('endDate') endDate: string
    ): Promise<ScheduleResponseDto> {
        const schedules = await this.schedulingService.getRoomSchedule(
            roomId,
            new Date(startDate),
            new Date(endDate)
        );

        const response = new ScheduleResponseDto();
        response.success = true;
        response.data = schedules[0]; // Return first schedule if exists
        if (!schedules.length) {
            response.success = false;
            response.message = 'Không tìm thấy lịch sử dụng cho phòng này';
        }
        return response;
    }

    @Put(':id')
    async updateSchedule(
        @Param('id', ParseIntPipe) id: number,
        @Body() updateScheduleDto: UpdateScheduleDto
    ): Promise<ScheduleResponseDto> {
        const [schedule, conflicts] = await this.schedulingService.updateClassSchedule(
            id,
            updateScheduleDto
        );

        if (schedule) {
            return ScheduleResponseDto.fromSchedule(schedule);
        }
        return ScheduleResponseDto.fromConflicts(conflicts);
    }

    @Delete(':id')
    async deleteSchedule(
        @Param('id', ParseIntPipe) id: number
    ): Promise<{ success: boolean; message: string }> {
        await this.schedulingService.deleteClassSchedule(id);
        return {
            success: true,
            message: 'Đã xóa lịch học thành công'
        };
    }
}
