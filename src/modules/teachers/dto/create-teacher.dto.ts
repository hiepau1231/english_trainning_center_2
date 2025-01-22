import {
  IsNotEmpty,
  IsString,
  IsEmail,
  IsOptional,
  IsBoolean,
} from 'class-validator';

export class CreateTeacherDto {
  @IsNotEmpty()
  @IsString()
  teacher_name: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsBoolean()
  is_foreign?: boolean;

  @IsOptional()
  @IsBoolean()
  is_Fulltime?: boolean;

  @IsOptional()
  @IsBoolean()
  is_Parttime?: boolean;

  @IsOptional()
  @IsString()
  phone_number?: string;

  @IsOptional()
  working_type_id?: number;

  @IsOptional()
  courses_level_id?: number;

  @IsOptional()
  level_ids?: number[];
}
