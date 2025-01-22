import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UploadController } from './upload.controller';
import { UploadService } from './upload.service';
import { Teacher } from '../teachers/entities/teacher.entity';
import { Class } from '../classes/entities/class.entity';
import { Schedule } from '../schedules/entities/schedule.entity';
import { Shift } from '../shifts/entities/shift.entity';
import { Level } from '../levels/entities/level.entity';
import { Classroom } from '../rooms/entities/classroom.entity';
import { Course } from '../courses/entities/course.entity';
import { ClassTeacher } from '../classes/entities/class-teacher.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Teacher,
      Class,
      Schedule,
      Shift,
      Level,
      Classroom,
      Course,
      ClassTeacher,
    ]),
  ],
  controllers: [UploadController],
  providers: [UploadService],
})
export class UploadModule {}
