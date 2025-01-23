import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TeacherAvailability } from './entities/teacher-availability.entity';
import { RoomSchedule } from './entities/room-schedule.entity';
import { ClassSchedule } from './entities/class-schedule.entity';
import { TeacherAvailabilityRepository } from './repositories/teacher-availability.repository';
import { RoomScheduleRepository } from './repositories/room-schedule.repository';
import { ClassScheduleRepository } from './repositories/class-schedule.repository';
import { SchedulingService } from './services/scheduling.service';
import { SchedulesController } from './schedules.controller';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            TeacherAvailability,
            RoomSchedule,
            ClassSchedule
        ])
    ],
    controllers: [
        SchedulesController
    ],
    providers: [
        TeacherAvailabilityRepository,
        RoomScheduleRepository,
        ClassScheduleRepository,
        SchedulingService
    ],
    exports: [
        TeacherAvailabilityRepository,
        RoomScheduleRepository,
        ClassScheduleRepository,
        SchedulingService
    ]
})
export class SchedulesModule {}
