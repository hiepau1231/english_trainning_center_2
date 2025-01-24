import { Test, TestingModule } from '@nestjs/testing';
import { SchedulesController } from '@modules/schedules/schedules.controller';
import { SchedulingService } from '@modules/schedules/services/scheduling.service';
import { CreateScheduleDto } from '@modules/schedules/dto/create-schedule.dto';
import { UpdateScheduleDto } from '@modules/schedules/dto/update-schedule.dto';
import { ScheduleResponseDto, AvailableSlotsResponseDto } from '@modules/schedules/dto/schedule-response.dto';
import { ClassSchedule } from '@modules/schedules/entities/class-schedule.entity';
import { ScheduleConflict, ClassTimeSlot } from '@modules/schedules/repositories/class-schedule.repository';

describe('SchedulesController', () => {
  let controller: SchedulesController;
  let service: SchedulingService;

  beforeEach(async () => {
    const mockSchedulingService = {
      createClassSchedule: jest.fn(),
      findAvailableSlots: jest.fn(),
      getClassSchedule: jest.fn(),
      getTeacherSchedule: jest.fn(),
      getRoomSchedule: jest.fn(),
      updateClassSchedule: jest.fn(),
      deleteClassSchedule: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [SchedulesController],
      providers: [
        {
          provide: SchedulingService,
          useValue: mockSchedulingService,
        },
      ],
    }).compile();

    controller = module.get<SchedulesController>(SchedulesController);
    service = module.get<SchedulingService>(SchedulingService);
  });

  describe('createClassSchedule', () => {
    it('nên tạo lịch học thành công khi không có xung đột', async () => {
      // Arrange
      const createDto: CreateScheduleDto = {
        classId: 1,
        roomId: 1,
        teacherId: 1,
        dayOfWeek: 1,
        startTime: '08:00',
        endTime: '10:00',
        startDate: new Date('2025-01-24'),
        endDate: new Date('2025-02-24'),
      };

      const mockSchedule = new ClassSchedule();
      Object.assign(mockSchedule, {
        id: 1,
        classId: 1,
        roomId: 1,
        teacherId: 1,
        dayOfWeek: 1,
        startTime: '08:00',
        endTime: '10:00',
        startDate: new Date('2025-01-24'),
        endDate: new Date('2025-02-24'),
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      jest.spyOn(service, 'createClassSchedule').mockResolvedValue([mockSchedule, undefined]);

      // Act
      const result = await controller.createClassSchedule(createDto);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(service.createClassSchedule).toHaveBeenCalledWith(createDto);
    });

    it('nên trả về xung đột khi có lịch trùng', async () => {
      // Arrange
      const createDto: CreateScheduleDto = {
        classId: 1,
        roomId: 1,
        teacherId: 1,
        dayOfWeek: 1,
        startTime: '08:00',
        endTime: '10:00',
        startDate: new Date('2025-01-24'),
        endDate: new Date('2025-02-24'),
      };

      const existingSchedule = new ClassSchedule();
      Object.assign(existingSchedule, {
        id: 2,
        classId: 2,
        roomId: 1,
        teacherId: 1,
        dayOfWeek: 1,
        startTime: '09:00',
        endTime: '11:00',
        startDate: new Date('2025-01-24'),
        endDate: new Date('2025-02-24'),
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const requestedSlot: ClassTimeSlot = {
        dayOfWeek: 1,
        startTime: '08:00',
        endTime: '10:00',
        startDate: new Date('2025-01-24'),
        endDate: new Date('2025-02-24'),
      };

      const conflicts: ScheduleConflict[] = [{
        type: 'teacher',
        entityId: 1,
        existingSchedule,
        requestedSlot
      }];

      jest.spyOn(service, 'createClassSchedule').mockResolvedValue([undefined, conflicts]);

      // Act
      const result = await controller.createClassSchedule(createDto);

      // Assert
      expect(result.success).toBe(false);
      expect(result.conflicts).toBeDefined();
    });
  });

  describe('findAvailableSlots', () => {
    it('nên tìm được các khung giờ trống', async () => {
      // Arrange
      const teacherId = 1;
      const rooms = '1,2,3';
      const startDate = '2025-01-24';
      const endDate = '2025-02-24';
      const preferredDays = '1,2,3,4,5';

      const mockSuggestion = {
        teacherId: 1,
        roomId: 1,
        timeSlot: {
          dayOfWeek: 1,
          startTime: '08:00',
          endTime: '10:00',
          startDate: new Date('2025-01-24'),
          endDate: new Date('2025-02-24'),
        },
        score: 0.8
      };

      jest.spyOn(service, 'findAvailableSlots').mockResolvedValue([mockSuggestion]);

      // Act
      const result = await controller.findAvailableSlots(
        teacherId,
        rooms,
        startDate,
        endDate,
        preferredDays,
      );

      // Assert
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(service.findAvailableSlots).toHaveBeenCalled();
    });
  });

  describe('getClassSchedule', () => {
    it('nên trả về lịch học của lớp khi tìm thấy', async () => {
      // Arrange
      const classId = 1;
      const mockSchedule = new ClassSchedule();
      Object.assign(mockSchedule, {
        id: 1,
        classId: 1,
        roomId: 1,
        teacherId: 1,
        dayOfWeek: 1,
        startTime: '08:00',
        endTime: '10:00',
        startDate: new Date('2025-01-24'),
        endDate: new Date('2025-02-24'),
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      jest.spyOn(service, 'getClassSchedule').mockResolvedValue([mockSchedule]);

      // Act
      const result = await controller.getClassSchedule(classId);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(service.getClassSchedule).toHaveBeenCalledWith(classId);
    });

    it('nên trả về thông báo lỗi khi không tìm thấy lịch học', async () => {
      // Arrange
      const classId = 999;
      jest.spyOn(service, 'getClassSchedule').mockResolvedValue([]);

      // Act
      const result = await controller.getClassSchedule(classId);

      // Assert
      expect(result.success).toBe(false);
      expect(result.message).toBe('Không tìm thấy lịch học cho lớp này');
    });
  });

  describe('getTeacherSchedule', () => {
    it('nên trả về lịch dạy của giáo viên', async () => {
      // Arrange
      const teacherId = 1;
      const startDate = '2025-01-24';
      const endDate = '2025-02-24';
      
      const mockSchedule = new ClassSchedule();
      Object.assign(mockSchedule, {
        id: 1,
        classId: 1,
        teacherId: 1,
        roomId: 1,
        dayOfWeek: 1,
        startTime: '08:00',
        endTime: '10:00',
        startDate: new Date('2025-01-24'),
        endDate: new Date('2025-02-24'),
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      jest.spyOn(service, 'getTeacherSchedule').mockResolvedValue([mockSchedule]);

      // Act
      const result = await controller.getTeacherSchedule(teacherId, startDate, endDate);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(service.getTeacherSchedule).toHaveBeenCalled();
    });
  });

  describe('getRoomSchedule', () => {
    it('nên trả về lịch sử dụng của phòng', async () => {
      // Arrange
      const roomId = 1;
      const startDate = '2025-01-24';
      const endDate = '2025-02-24';
      
      const mockSchedule = new ClassSchedule();
      Object.assign(mockSchedule, {
        id: 1,
        classId: 1,
        roomId: 1,
        teacherId: 1,
        dayOfWeek: 1,
        startTime: '08:00',
        endTime: '10:00',
        startDate: new Date('2025-01-24'),
        endDate: new Date('2025-02-24'),
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      jest.spyOn(service, 'getRoomSchedule').mockResolvedValue([mockSchedule]);

      // Act
      const result = await controller.getRoomSchedule(roomId, startDate, endDate);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(service.getRoomSchedule).toHaveBeenCalled();
    });
  });

  describe('updateSchedule', () => {
    it('nên cập nhật lịch học thành công khi không có xung đột', async () => {
      // Arrange
      const scheduleId = 1;
      const updateDto: UpdateScheduleDto = {
        roomId: 2,
        dayOfWeek: 2,
        startTime: '09:00',
        endTime: '11:00',
        startDate: new Date('2025-02-01'),
        endDate: new Date('2025-03-01'),
      };

      const mockSchedule = new ClassSchedule();
      Object.assign(mockSchedule, {
        id: scheduleId,
        classId: 1,
        roomId: 2,
        teacherId: 1,
        dayOfWeek: 2,
        startTime: '09:00',
        endTime: '11:00',
        startDate: new Date('2025-02-01'),
        endDate: new Date('2025-03-01'),
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      jest.spyOn(service, 'updateClassSchedule').mockResolvedValue([mockSchedule, undefined]);

      // Act
      const result = await controller.updateSchedule(scheduleId, updateDto);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(service.updateClassSchedule).toHaveBeenCalledWith(scheduleId, updateDto);
    });

    it('nên trả về xung đột khi cập nhật gây trùng lịch', async () => {
      // Arrange
      const scheduleId = 1;
      const updateDto: UpdateScheduleDto = {
        roomId: 2,
        dayOfWeek: 2,
        startTime: '09:00',
        endTime: '11:00',
        startDate: new Date('2025-02-01'),
        endDate: new Date('2025-03-01'),
      };

      const existingSchedule = new ClassSchedule();
      Object.assign(existingSchedule, {
        id: 3,
        classId: 3,
        roomId: 2,
        teacherId: 2,
        dayOfWeek: 2,
        startTime: '10:00',
        endTime: '12:00',
        startDate: new Date('2025-02-01'),
        endDate: new Date('2025-03-01'),
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const requestedSlot: ClassTimeSlot = {
        dayOfWeek: 2,
        startTime: '09:00',
        endTime: '11:00',
        startDate: new Date('2025-02-01'),
        endDate: new Date('2025-03-01'),
      };

      const conflicts: ScheduleConflict[] = [{
        type: 'room',
        entityId: 2,
        existingSchedule,
        requestedSlot
      }];

      jest.spyOn(service, 'updateClassSchedule').mockResolvedValue([undefined, conflicts]);

      // Act
      const result = await controller.updateSchedule(scheduleId, updateDto);

      // Assert
      expect(result.success).toBe(false);
      expect(result.conflicts).toBeDefined();
    });
  });

  describe('deleteSchedule', () => {
    it('nên xóa lịch học thành công', async () => {
      // Arrange
      const scheduleId = 1;
      jest.spyOn(service, 'deleteClassSchedule').mockResolvedValue(undefined);

      // Act
      const result = await controller.deleteSchedule(scheduleId);

      // Assert
      expect(result.success).toBe(true);
      expect(result.message).toBe('Đã xóa lịch học thành công');
      expect(service.deleteClassSchedule).toHaveBeenCalledWith(scheduleId);
    });
  });
});