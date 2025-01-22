import { IsNotEmpty, IsString, IsNumber, IsOptional } from 'class-validator';

export class CreateClassroomDto {
  @IsNotEmpty()
  @IsString()
  room_name: string;

  @IsOptional()
  @IsNumber()
  capacity?: number;
}
