import { IsNotEmpty, IsString, IsOptional, IsDate } from 'class-validator';
import { Type } from 'class-transformer';
import { TeacherRole } from '../enums/teacher-role.enum';

export class CreateClassDto {
  @IsNotEmpty()
  @IsString()
  class_name: string;

  @IsNotEmpty()
  course_id: number;

  @IsNotEmpty()
  classroom_id: number;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  start_date?: Date;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  end_date?: Date;

  @IsOptional()
  teacher_ids?: number[];

  @IsOptional()
  schedule_ids?: number[];

  @IsOptional()
  teachers?: {
    teacher_id: number;
    role: TeacherRole;
  }[];
}
