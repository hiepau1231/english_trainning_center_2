import { IsNotEmpty, IsString, IsEnum, IsOptional } from 'class-validator';
import { CourseStatus, CourseLevel } from '../entities/course.entity';

export class CreateCourseDto {
  @IsNotEmpty()
  @IsString()
  course_name: string;

  @IsOptional()
  @IsEnum(CourseStatus)
  status?: CourseStatus;

  @IsOptional()
  @IsEnum(CourseLevel)
  level?: CourseLevel;
}
