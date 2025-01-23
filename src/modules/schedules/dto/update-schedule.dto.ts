import { IsInt, IsString, IsDateString, IsOptional, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateScheduleDto {
    @IsInt()
    @IsOptional()
    teacherId?: number;

    @IsInt()
    @IsOptional()
    roomId?: number;

    @IsInt()
    @Min(0)
    @Max(6)
    @IsOptional()
    dayOfWeek?: number;

    @IsString()
    @IsOptional()
    startTime?: string;

    @IsString()
    @IsOptional()
    endTime?: string;

    @IsDateString()
    @IsOptional()
    @Type(() => Date)
    startDate?: Date;

    @IsDateString()
    @IsOptional()
    @Type(() => Date)
    endDate?: Date;
}