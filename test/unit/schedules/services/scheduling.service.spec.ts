import { Test } from '@nestjs/testing';
import { SchedulingService, ScheduleCreationParams } from '@modules/schedules/services/scheduling.service';
import { TeacherAvailabilityRepository } from '@modules/schedules/repositories/teacher-availability.repository';
import { RoomScheduleRepository } from '@modules/schedules/repositories/room-schedule.repository';
import { ClassScheduleRepository, ClassTimeSlot } from '@modules/schedules/repositories/class-schedule.repository';
import { ClassSchedule } from '@modules/schedules/entities/class-schedule.entity';
import { AvailabilityStatus, RepeatPattern } from '@modules/schedules/entities/teacher-availability.entity';

describe('SchedulingService', () => {
    let service: SchedulingService;
    let teacherAvailabilityRepo: jest.Mocked<TeacherAvailabilityRepository>;
    let roomScheduleRepo: jest.Mocked<RoomScheduleRepository>;
    let classScheduleRepo: jest.Mocked<ClassScheduleRepository>;

    const mockTimeSlot: ClassTimeSlot = {
        dayOfWeek: 1,
        startTime: '09:00:00',
        endTime: '10:30:00',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-03-31')
    };

    const mockSchedule = new ClassSchedule();
    Object.assign(mockSchedule, {
        id: 1,
        classId: 1,
        teacherId: 1,
        roomId: 1,
        ...mockTimeSlot,
        createdAt: new Date(),
        updatedAt: new Date(),
        isDateInSchedule: jest.fn(),
        hasConflictWith: jest.fn()
    });

    beforeEach(async () => {
        const moduleRef = await Test.createTestingModule({
            providers: [
                SchedulingService,
                {
                    provide: TeacherAvailabilityRepository,
                    useValue: {
                        checkConflicts: jest.fn(),
                        getTeacherAvailability: jest.fn()
                    }
                },
                {
                    provide: RoomScheduleRepository,
                    useValue: {
                        checkConflicts: jest.fn()
                    }
                },
                {
                    provide: ClassScheduleRepository,
                    useValue: {
                        createSchedule: jest.fn(),
                        findConflicts: jest.fn(),
                        getClassSchedule: jest.fn(),
                        getTeacherSchedule: jest.fn(),
                        getRoomSchedule: jest.fn(),
                        findOne: jest.fn(),
                        updateSchedule: jest.fn(),
                        deleteSchedule: jest.fn()
                    }
                }
            ]
        }).compile();

        service = moduleRef.get<SchedulingService>(SchedulingService);
        teacherAvailabilityRepo = moduleRef.get(TeacherAvailabilityRepository);
        roomScheduleRepo = moduleRef.get(RoomScheduleRepository);
        classScheduleRepo = moduleRef.get(ClassScheduleRepository);
    });

    describe('createClassSchedule', () => {
        const createParams: ScheduleCreationParams = {
            classId: 1,
            teacherId: 1,
            roomId: 1,
            ...mockTimeSlot
        };

        it('should create schedule when no conflicts exist', async () => {
            teacherAvailabilityRepo.checkConflicts.mockResolvedValue([]);
            roomScheduleRepo.checkConflicts.mockResolvedValue([]);
            classScheduleRepo.findConflicts.mockResolvedValue([]);
            classScheduleRepo.createSchedule.mockResolvedValue(mockSchedule);

            const [schedule, conflicts] = await service.createClassSchedule(createParams);

            expect(schedule).toBeDefined();
            expect(conflicts).toHaveLength(0);
            expect(classScheduleRepo.createSchedule).toHaveBeenCalledWith(
                createParams.classId,
                createParams.teacherId,
                createParams.roomId,
                expect.objectContaining(mockTimeSlot)
            );
        });

        it('should return conflicts when they exist', async () => {
            const mockAvailabilityConflict = {
                teacherId: 1,
                existingSlot: {
                    dayOfWeek: 1,
                    startTime: '09:00:00',
                    endTime: '10:30:00'
                },
                requestedSlot: {
                    dayOfWeek: 1,
                    startTime: '09:00:00',
                    endTime: '10:30:00'
                }
            };

            teacherAvailabilityRepo.checkConflicts.mockResolvedValue([mockAvailabilityConflict]);
            roomScheduleRepo.checkConflicts.mockResolvedValue([]);
            classScheduleRepo.findConflicts.mockResolvedValue([]);

            const [schedule, conflicts] = await service.createClassSchedule(createParams);

            expect(schedule).toBeNull();
            expect(conflicts).toHaveLength(1);
            expect(conflicts[0]).toEqual(mockAvailabilityConflict);
            expect(classScheduleRepo.createSchedule).not.toHaveBeenCalled();
        });

        it('should handle database errors', async () => {
            teacherAvailabilityRepo.checkConflicts.mockRejectedValue(new Error('Database error'));

            await expect(service.createClassSchedule(createParams)).rejects.toThrow('Database error');
        });
    });

    describe('findAvailableSlots', () => {
        const preferredRooms = [1, 2];
        const startDate = new Date('2024-01-01');
        const endDate = new Date('2024-03-31');

        it('should return available slots sorted by score', async () => {
            const mockTeacherAvailability = {
                id: 1,
                teacherId: 1,
                dayOfWeek: 2,
                startTime: '09:00:00',
                endTime: '17:00:00',
                status: AvailabilityStatus.PREFERRED,
                repeatPattern: RepeatPattern.WEEKLY,
                teacher: null,
                createdAt: new Date(),
                updatedAt: new Date()
            };
            teacherAvailabilityRepo.getTeacherAvailability.mockResolvedValue([mockTeacherAvailability]);
            classScheduleRepo.findConflicts.mockResolvedValue([]);

            const result = await service.findAvailableSlots(1, preferredRooms, startDate, endDate);

            expect(Array.isArray(result)).toBeTruthy();
            expect(result).toHaveLength(5); // Limited to top 5
            expect(result[0].score).toBeGreaterThanOrEqual(result[1].score); // Sorted by score
        });

        it('should handle empty availability', async () => {
            teacherAvailabilityRepo.getTeacherAvailability.mockResolvedValue([]);
            classScheduleRepo.findConflicts.mockResolvedValue([]); // No conflicts

            const result = await service.findAvailableSlots(1, preferredRooms, startDate, endDate);

            expect(Array.isArray(result)).toBeTruthy();
            expect(result.length).toBeGreaterThan(0); // Should still find slots
        });

        it('should handle conflicts', async () => {
            const mockConflict = {
                type: 'room' as const,
                entityId: 1,
                existingSchedule: null,
                requestedSlot: mockTimeSlot
            };
            
            teacherAvailabilityRepo.getTeacherAvailability.mockResolvedValue([]);
            classScheduleRepo.findConflicts.mockResolvedValue([mockConflict]);

            const result = await service.findAvailableSlots(1, [1], startDate, endDate);

            expect(result).toHaveLength(0); // No available slots due to conflicts
        });
    });

    describe('updateClassSchedule', () => {
        const updates: Partial<ScheduleCreationParams> = {
            startTime: '10:00:00',
            endTime: '11:30:00'
        };

        it('should update schedule when no conflicts exist', async () => {
            classScheduleRepo.findOne.mockResolvedValue(mockSchedule);
            teacherAvailabilityRepo.checkConflicts.mockResolvedValue([]);
            roomScheduleRepo.checkConflicts.mockResolvedValue([]);
            classScheduleRepo.findConflicts.mockResolvedValue([]);
            const updatedSchedule = new ClassSchedule();
            Object.assign(updatedSchedule, {
                ...mockSchedule,
                ...updates,
                isDateInSchedule: jest.fn(),
                hasConflictWith: jest.fn()
            });
            classScheduleRepo.updateSchedule.mockResolvedValue(updatedSchedule);

            const [schedule, conflicts] = await service.updateClassSchedule(1, updates);

            expect(schedule).toBeDefined();
            expect(conflicts).toHaveLength(0);
            expect(classScheduleRepo.updateSchedule).toHaveBeenCalled();
        });

        it('should handle non-existent schedule', async () => {
            classScheduleRepo.findOne.mockResolvedValue(null);

            await expect(service.updateClassSchedule(999, updates))
                .rejects.toThrow('Schedule not found');
        });

        it('should return conflicts when they exist', async () => {
            classScheduleRepo.findOne.mockResolvedValue(mockSchedule);
            const mockAvailabilityConflict = {
                teacherId: 1,
                existingSlot: {
                    dayOfWeek: 1,
                    startTime: '09:00:00',
                    endTime: '10:30:00'
                },
                requestedSlot: {
                    dayOfWeek: 1,
                    startTime: '09:00:00',
                    endTime: '10:30:00'
                }
            };
            teacherAvailabilityRepo.checkConflicts.mockResolvedValue([mockAvailabilityConflict]);

            const [schedule, conflicts] = await service.updateClassSchedule(1, updates);

            expect(schedule).toBeNull();
            expect(conflicts).toHaveLength(1);
            expect(conflicts[0]).toEqual(mockAvailabilityConflict);
            expect(classScheduleRepo.updateSchedule).not.toHaveBeenCalled();
        });
    });

    describe('query methods', () => {
        describe('getClassSchedule', () => {
            it('should return class schedules', async () => {
                classScheduleRepo.getClassSchedule.mockResolvedValue([mockSchedule]);

                const result = await service.getClassSchedule(1);

                expect(result).toHaveLength(1);
                expect(result[0]).toEqual(mockSchedule);
            });

            it('should handle database errors', async () => {
                classScheduleRepo.getClassSchedule.mockRejectedValue(new Error('Database error'));

                await expect(service.getClassSchedule(1)).rejects.toThrow('Database error');
            });
        });

        describe('getTeacherSchedule', () => {
            it('should return teacher schedules within date range', async () => {
                classScheduleRepo.getTeacherSchedule.mockResolvedValue([mockSchedule]);

                const result = await service.getTeacherSchedule(
                    1,
                    new Date('2024-01-01'),
                    new Date('2024-03-31')
                );

                expect(result).toHaveLength(1);
                expect(result[0]).toEqual(mockSchedule);
            });
        });

        describe('getRoomSchedule', () => {
            it('should return room schedules within date range', async () => {
                classScheduleRepo.getRoomSchedule.mockResolvedValue([mockSchedule]);

                const result = await service.getRoomSchedule(
                    1,
                    new Date('2024-01-01'),
                    new Date('2024-03-31')
                );

                expect(result).toHaveLength(1);
                expect(result[0]).toEqual(mockSchedule);
            });
        });
    });

    describe('deleteClassSchedule', () => {
        it('should delete schedule successfully', async () => {
            classScheduleRepo.deleteSchedule.mockResolvedValue(undefined);

            await expect(service.deleteClassSchedule(1)).resolves.toBeUndefined();
            expect(classScheduleRepo.deleteSchedule).toHaveBeenCalledWith(1);
        });

        it('should handle database errors', async () => {
            classScheduleRepo.deleteSchedule.mockRejectedValue(new Error('Database error'));

            await expect(service.deleteClassSchedule(1)).rejects.toThrow('Database error');
        });
    });
});