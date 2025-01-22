import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { RoomsModule } from './modules/rooms/rooms.module';
import { SchedulesModule } from './modules/schedules/schedules.module';
import { ShiftsModule } from './modules/shifts/shifts.module';
import { TeachersModule } from './modules/teachers/teachers.module';
import { LevelsModule } from './modules/levels/levels.module';
import { CoursesModule } from './modules/courses/courses.module';
import { UploadModule } from './modules/upload/upload.module';
import { ClassesModule } from './modules/classes/classes.module';
import { MulterModule } from '@nestjs/platform-express';
import * as multer from 'multer';

@Module({
  imports: [
    ConfigModule.forRoot(),
    MulterModule.register({
      dest: './uploads',
      storage: multer.memoryStorage(),
    }),
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT) || 3306,
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
      synchronize: false,
      logging: true,
    }),
    RoomsModule,
    ClassesModule,
    SchedulesModule,
    ShiftsModule,
    TeachersModule,
    LevelsModule,
    CoursesModule,
    UploadModule,
  ],
})
export class AppModule {}
