import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TeachersController } from './teachers.controller';
import { TeachersService } from './teachers.service';
import { Teacher } from './entities/teacher.entity';
import { TeacherRepository } from './repositories/teacher.repository';

@Module({
  imports: [TypeOrmModule.forFeature([Teacher])],
  controllers: [TeachersController],
  providers: [TeachersService, TeacherRepository],
  exports: [TeachersService, TeacherRepository],
})
export class TeachersModule {}
