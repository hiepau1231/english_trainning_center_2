import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UploadController } from './upload.controller';
import { UploadService } from './upload.service';
import { TeachersModule } from '../teachers/teachers.module';
import { ClassesModule } from '../classes/classes.module';
import { Schedule } from '../schedules/entities/schedule.entity';
import { Shift } from '../shifts/entities/shift.entity';
import { Level } from '../levels/entities/level.entity';
import { Classroom } from '../rooms/entities/classroom.entity';
import { Course } from '../courses/entities/course.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Schedule,
      Shift,
      Level,
      Classroom,
      Course,
    ]),
    TeachersModule,
    ClassesModule, // Import ClassesModule to use ClassRepository
  ],
  controllers: [UploadController],
  providers: [UploadService],
})
export class UploadModule {}
