import { IsNotEmpty, IsString, IsOptional } from 'class-validator';

export class CreateShiftDto {
  @IsNotEmpty()
  @IsString()
  teaching_shift: string;

  @IsOptional()
  class_id?: number;
}
