import { IsNotEmpty, IsDate, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateScheduleDto {
  @IsNotEmpty()
  @IsDate()
  @Type(() => Date)
  schedule_date: Date;

  @IsNotEmpty()
  classroom_id: number;

  @IsOptional()
  class_ids?: number[];

  @IsOptional()
  shift_ids?: number[];
}
