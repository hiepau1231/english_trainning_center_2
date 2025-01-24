import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { ClassScheduleRepository, ClassTimeSlot } from '@modules/schedules/repositories/class-schedule.repository';
import { ClassSchedule } from '@modules/schedules/entities/class-schedule.entity';
import { Class } from '@modules/classes/entities/class.entity';
import { Teacher } from '@modules/teachers/entities/teacher.entity';
import { Classroom } from '@modules/rooms/entities/classroom.entity';

describe('ClassScheduleRepository', () => {
    let repository: ClassScheduleRepository;
    let typeormRepository: Repository<ClassSchedule>;
    let queryBuilder: SelectQueryBuilder<ClassSchedule>;

    const mockTimeSlot: ClassTimeSlot = {
        dayOfWeek: 1,
        startTime: '09:00:00',
        endTime: '10:30:00',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-03-31')
    };

    const mockClass = {} as Class;
    const mockTeacher = {} as Teacher;
    const mockRoom = {} as Classroom;

    const mockSchedule = new ClassSchedule();
    Object.assign(mockSchedule, {
        id: 1,
        classId: 1,
        class: mockClass,
        teacherId: 1,
        teacher: mockTeacher,
        roomId: 1,
        room: mockRoom,
        dayOfWeek: 1,
        startTime: '09:00:00',
        endTime: '10:30:00',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-03-31'),
        createdAt: new Date(),
        updatedAt: new Date()
    });

    beforeEach(async () => {
        // Create mock query builder
        queryBuilder = {
            where: jest.fn().mockReturnThis(),
            andWhere: jest.fn().mockReturnThis(),
            getMany: jest.fn().mockResolvedValue([]),
            orderBy: jest.fn().mockReturnThis()
        } as any;

        // Create mock repository
        const mockRepository = {
            create: jest.fn(),
            save: jest.fn(),
            find: jest.fn(),
            findOne: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
            createQueryBuilder: jest.fn().mockReturnValue(queryBuilder)
        };

        const module = await Test.createTestingModule({
            providers: [
                ClassScheduleRepository,
                {
                    provide: getRepositoryToken(ClassSchedule),
                    useValue: mockRepository
                }
            ]
        }).compile();

        repository = module.get<ClassScheduleRepository>(ClassScheduleRepository);
        typeormRepository = module.get<Repository<ClassSchedule>>(getRepositoryToken(ClassSchedule));
    });

    describe('createSchedule', () => {
        it('should create a new schedule successfully', async () => {
            jest.spyOn(typeormRepository, 'save').mockResolvedValue(mockSchedule);

            const result = await repository.createSchedule(
                mockSchedule.classId,
                mockSchedule.teacherId,
                mockSchedule.roomId,
                mockTimeSlot
            );

            expect(result).toEqual(mockSchedule);
            expect(typeormRepository.save).toHaveBeenCalledWith(expect.objectContaining({
                classId: mockSchedule.classId,
                teacherId: mockSchedule.teacherId,
                roomId: mockSchedule.roomId,
                ...mockTimeSlot
            }));
        });
    });

    describe('findConflicts', () => {
        const timeSlotWithIds = {
            ...mockTimeSlot,
            teacherId: 1,
            roomId: 1
        };

        it('should find conflicts for a given time slot', async () => {
            const mockConflict = mockSchedule;
            jest.spyOn(queryBuilder, 'getMany').mockResolvedValue([mockConflict]);

            const result = await repository.findConflicts(mockTimeSlot);

            expect(result).toHaveLength(1);
            expect(queryBuilder.where).toHaveBeenCalledWith(
                'schedule.day_of_week = :dayOfWeek',
                { dayOfWeek: mockTimeSlot.dayOfWeek }
            );
        });

        it('should exclude specified class when checking conflicts', async () => {
            await repository.findConflicts(mockTimeSlot, 1);

            expect(queryBuilder.andWhere).toHaveBeenCalledWith(
                'schedule.class_id != :excludeClassId',
                { excludeClassId: 1 }
            );
        });
    });

    describe('getClassSchedule', () => {
        it('should return schedules for a specific class', async () => {
            jest.spyOn(typeormRepository, 'find').mockResolvedValue([mockSchedule]);

            const result = await repository.getClassSchedule(1);

            expect(result).toEqual([mockSchedule]);
            expect(typeormRepository.find).toHaveBeenCalledWith({
                where: { classId: 1 },
                order: {
                    dayOfWeek: 'ASC',
                    startTime: 'ASC'
                }
            });
        });
    });

    describe('getTeacherSchedule', () => {
        it('should return schedules for a specific teacher within date range', async () => {
            jest.spyOn(typeormRepository, 'find').mockResolvedValue([mockSchedule]);

            const result = await repository.getTeacherSchedule(
                1,
                new Date('2024-01-01'),
                new Date('2024-03-31')
            );

            expect(result).toEqual([mockSchedule]);
            expect(typeormRepository.find).toHaveBeenCalled();
        });
    });

    describe('getRoomSchedule', () => {
        it('should return schedules for a specific room within date range', async () => {
            jest.spyOn(typeormRepository, 'find').mockResolvedValue([mockSchedule]);

            const result = await repository.getRoomSchedule(
                1,
                new Date('2024-01-01'),
                new Date('2024-03-31')
            );

            expect(result).toEqual([mockSchedule]);
            expect(typeormRepository.find).toHaveBeenCalled();
        });
    });

    describe('updateSchedule', () => {
        it('should update and return the schedule', async () => {
            jest.spyOn(typeormRepository, 'update').mockResolvedValue(undefined);
            jest.spyOn(typeormRepository, 'findOne').mockResolvedValue(mockSchedule);

            const updates = {
                startTime: '10:00:00',
                endTime: '11:30:00'
            };

            const result = await repository.updateSchedule(1, updates);

            expect(result).toEqual(mockSchedule);
            expect(typeormRepository.update).toHaveBeenCalledWith(1, updates);
            expect(typeormRepository.findOne).toHaveBeenCalledWith({ where: { id: 1 } });
        });
    });

    describe('deleteSchedule', () => {
        it('should delete the schedule', async () => {
            jest.spyOn(typeormRepository, 'delete').mockResolvedValue(undefined);

            await repository.deleteSchedule(1);

            expect(typeormRepository.delete).toHaveBeenCalledWith(1);
        });
    });

    describe('findAvailableSlots', () => {
        it('should find available slots considering existing schedules', async () => {
            jest.spyOn(repository, 'getTeacherSchedule').mockResolvedValue([]);
            jest.spyOn(repository, 'getRoomSchedule').mockResolvedValue([]);
            jest.spyOn(repository, 'findConflicts').mockResolvedValue([]);

            const result = await repository.findAvailableSlots(
                1,
                1,
                new Date('2024-01-01'),
                new Date('2024-03-31')
            );

            expect(Array.isArray(result)).toBeTruthy();
            expect(repository.getTeacherSchedule).toHaveBeenCalled();
            expect(repository.getRoomSchedule).toHaveBeenCalled();
        });

        it('should not include weekend slots', async () => {
            jest.spyOn(repository, 'getTeacherSchedule').mockResolvedValue([]);
            jest.spyOn(repository, 'getRoomSchedule').mockResolvedValue([]);
            jest.spyOn(repository, 'findConflicts').mockResolvedValue([]);

            const result = await repository.findAvailableSlots(
                1,
                1,
                new Date('2024-01-01'),
                new Date('2024-03-31')
            );

            const hasWeekendSlots = result.some(slot => slot.dayOfWeek === 0 || slot.dayOfWeek === 6);
            expect(hasWeekendSlots).toBeFalsy();
        });

        it('should handle case when no slots are available', async () => {
            const mockConflict = {
                type: 'class' as const,
                entityId: mockSchedule.classId,
                existingSchedule: mockSchedule,
                requestedSlot: mockTimeSlot
            };
            jest.spyOn(repository, 'findConflicts').mockResolvedValue([mockConflict]);

            const result = await repository.findAvailableSlots(
                1,
                1,
                new Date('2024-01-01'),
                new Date('2024-03-31')
            );

            expect(result).toHaveLength(0);
        });

        it('should handle database errors', async () => {
            jest.spyOn(repository, 'getTeacherSchedule')
                .mockRejectedValue(new Error('Database error'));

            await expect(repository.findAvailableSlots(
                1,
                1,
                new Date('2024-01-01'),
                new Date('2024-03-31')
            )).rejects.toThrow('Database error');
        });

        it('should handle invalid date ranges', async () => {
            const invalidEndDate = new Date('2023-12-31'); // End date before start date

            await expect(repository.findAvailableSlots(
                1,
                1,
                new Date('2024-01-01'),
                invalidEndDate
            )).rejects.toThrow();
        });
    });

    describe('ClassSchedule Entity Methods', () => {
        describe('isDateInSchedule', () => {
            it('should return true for date within schedule range', () => {
                const testDate = new Date('2024-02-15');
                expect(mockSchedule.isDateInSchedule(testDate)).toBeTruthy();
            });

            it('should return false for date outside schedule range', () => {
                const testDate = new Date('2024-04-01');
                expect(mockSchedule.isDateInSchedule(testDate)).toBeFalsy();
            });

            it('should handle exact boundary dates', () => {
                expect(mockSchedule.isDateInSchedule(new Date('2024-01-01'))).toBeTruthy();
                expect(mockSchedule.isDateInSchedule(new Date('2024-03-31'))).toBeTruthy();
            });

            it('should handle invalid date input', () => {
                expect(() => mockSchedule.isDateInSchedule(null)).toThrow();
                expect(() => mockSchedule.isDateInSchedule(undefined)).toThrow();
            });
        });

        describe('hasConflictWith', () => {
            it('should detect time conflict on same day', () => {
                const conflictingSchedule = new ClassSchedule();
                Object.assign(conflictingSchedule, {
                    ...mockSchedule,
                    id: 2,
                    startTime: '09:30:00',
                    endTime: '11:00:00'
                });

                expect(mockSchedule.hasConflictWith(conflictingSchedule)).toBeTruthy();
            });

            it('should not detect conflict on different days', () => {
                const nonConflictingSchedule = new ClassSchedule();
                Object.assign(nonConflictingSchedule, {
                    ...mockSchedule,
                    id: 2,
                    dayOfWeek: 2
                });

                expect(mockSchedule.hasConflictWith(nonConflictingSchedule)).toBeFalsy();
            });

            it('should not detect conflict outside date range', () => {
                const nonConflictingSchedule = new ClassSchedule();
                Object.assign(nonConflictingSchedule, {
                    ...mockSchedule,
                    id: 2,
                    startDate: new Date('2024-04-01'),
                    endDate: new Date('2024-06-30')
                });

                expect(mockSchedule.hasConflictWith(nonConflictingSchedule)).toBeFalsy();
            });

            it('should handle edge case time conflicts', () => {
                const edgeSchedule = new ClassSchedule();
                Object.assign(edgeSchedule, {
                    ...mockSchedule,
                    id: 2,
                    startTime: '10:30:00', // Exactly when mockSchedule ends
                    endTime: '12:00:00'
                });

                expect(mockSchedule.hasConflictWith(edgeSchedule)).toBeFalsy();
            });

            it('should handle back-to-back schedules', () => {
                const backToBackSchedule = new ClassSchedule();
                Object.assign(backToBackSchedule, {
                    ...mockSchedule,
                    id: 2,
                    startTime: '10:30:00',
                    endTime: '12:00:00',
                });

                expect(mockSchedule.hasConflictWith(backToBackSchedule)).toBeFalsy();
            });

            it('should detect conflict with exact same time', () => {
                const sameTimeSchedule = new ClassSchedule();
                Object.assign(sameTimeSchedule, {
                    ...mockSchedule,
                    id: 2
                });

                expect(mockSchedule.hasConflictWith(sameTimeSchedule)).toBeTruthy();
            });

            it('should handle invalid schedule input', () => {
                expect(() => mockSchedule.hasConflictWith(null)).toThrow();
                expect(() => mockSchedule.hasConflictWith(undefined)).toThrow();
            });
        });
    });
});