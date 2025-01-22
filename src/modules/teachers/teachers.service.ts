import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Teacher } from './entities/teacher.entity';
import { CreateTeacherDto } from './dto/create-teacher.dto';

@Injectable()
export class TeachersService {
  constructor(
    @InjectRepository(Teacher)
    private teacherRepository: Repository<Teacher>,
  ) {}

  async create(createTeacherDto: CreateTeacherDto) {
    const teacher = this.teacherRepository.create(createTeacherDto);
    return await this.teacherRepository.save(teacher);
  }

  async findAll() {
    return await this.teacherRepository.find({
      where: { is_deleted: false },
      relations: ['classes', 'levels'],
    });
  }

  async findOne(id: number) {
    const teacher = await this.teacherRepository.findOne({
      where: { id, is_deleted: false },
      relations: ['classes', 'levels'],
    });

    if (!teacher) {
      throw new NotFoundException(`Teacher with ID ${id} not found`);
    }

    return teacher;
  }

  async update(id: number, updateTeacherDto: Partial<CreateTeacherDto>) {
    const teacher = await this.findOne(id);
    Object.assign(teacher, updateTeacherDto);
    return await this.teacherRepository.save(teacher);
  }

  async softDelete(id: number) {
    const teacher = await this.findOne(id);
    teacher.is_deleted = true;
    teacher.deleted_at = new Date();
    return await this.teacherRepository.save(teacher);
  }

  async restore(id: number) {
    const teacher = await this.teacherRepository.findOne({
      where: { id, is_deleted: true },
    });

    if (!teacher) {
      throw new NotFoundException(`Teacher with ID ${id} not found`);
    }

    teacher.is_deleted = false;
    teacher.deleted_at = null;
    return await this.teacherRepository.save(teacher);
  }

  async getTeachersByLevel(teacherName: string) {
    const teacher = await this.teacherRepository.findOne({
      where: { teacher_name: teacherName, is_deleted: false },
      relations: ['levels'],
    });

    if (!teacher) {
      return [];
    }

    return await this.teacherRepository
      .createQueryBuilder('teacher')
      .leftJoinAndSelect('teacher.levels', 'level')
      .where('teacher.teacher_name != :teacherName', { teacherName })
      .andWhere('teacher.is_deleted = :isDeleted', { isDeleted: false })
      .getMany();
  }
}
