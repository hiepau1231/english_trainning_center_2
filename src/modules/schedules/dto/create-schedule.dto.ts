import { IsInt, IsString, IsDateString, IsNotEmpty, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateScheduleDto {
    @IsInt()
    @IsNotEmpty()
    classId: number;

    @IsInt()
    @IsNotEmpty()
    teacherId: number;

    @IsInt()
    @IsNotEmpty()
    roomId: number;

    @IsInt()
    @Min(0)
    @Max(6)
    @IsNotEmpty()
    dayOfWeek: number;

    @IsString()
    @IsNotEmpty()
    startTime: string;

    @IsString()
    @IsNotEmpty()
    endTime: string;

    @IsDateString()
    @IsNotEmpty()
    @Type(() => Date)
    startDate: Date;

    @IsDateString()
    @IsNotEmpty()
    @Type(() => Date)
    endDate: Date;
}
