import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClassesController } from './classes.controller';
import { ClassesService } from './classes.service';
import { Class } from './entities/class.entity';
import { ClassTeacher } from './entities/class-teacher.entity';
import { ClassRepository } from './repositories/class.repository';

@Module({
  imports: [TypeOrmModule.forFeature([Class, ClassTeacher])],
  controllers: [ClassesController],
  providers: [ClassesService, ClassRepository],
  exports: [ClassesService, ClassRepository],
})
export class ClassesModule {}
