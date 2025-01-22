import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Classroom } from './entities/classroom.entity';
import { CreateClassroomDto } from './dto/create-classroom.dto';

@Injectable()
export class RoomsService {
  constructor(
    @InjectRepository(Classroom)
    private classroomRepository: Repository<Classroom>,
  ) {}

  async create(createClassroomDto: CreateClassroomDto) {
    const classroom = this.classroomRepository.create(createClassroomDto);
    return await this.classroomRepository.save(classroom);
  }

  async findAll() {
    return await this.classroomRepository.find({
      where: { is_deleted: false },
      relations: ['classes', 'schedules'],
    });
  }

  async findOne(id: number) {
    const classroom = await this.classroomRepository.findOne({
      where: { id, is_deleted: false },
      relations: ['classes', 'schedules'],
    });

    if (!classroom) {
      throw new NotFoundException(`Classroom with ID ${id} not found`);
    }

    return classroom;
  }

  async update(id: number, updateClassroomDto: Partial<CreateClassroomDto>) {
    const classroom = await this.findOne(id);
    Object.assign(classroom, updateClassroomDto);
    return await this.classroomRepository.save(classroom);
  }

  async softDelete(id: number) {
    const classroom = await this.findOne(id);
    classroom.is_deleted = true;
    classroom.deleted_at = new Date();
    return await this.classroomRepository.save(classroom);
  }

  async restore(id: number) {
    const classroom = await this.classroomRepository.findOne({
      where: { id, is_deleted: true },
    });

    if (!classroom) {
      throw new NotFoundException(`Classroom with ID ${id} not found`);
    }

    classroom.is_deleted = false;
    classroom.deleted_at = null;
    return await this.classroomRepository.save(classroom);
  }
}
