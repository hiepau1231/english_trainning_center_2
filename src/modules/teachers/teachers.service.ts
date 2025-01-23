import { Injectable, NotFoundException } from '@nestjs/common';
import { Teacher } from './entities/teacher.entity';
import { CreateTeacherDto } from './dto/create-teacher.dto';
import { TeacherRepository } from './repositories/teacher.repository';

@Injectable()
export class TeachersService {
  constructor(
    private readonly teacherRepository: TeacherRepository,
  ) {}

  async create(createTeacherDto: CreateTeacherDto): Promise<Teacher> {
    return await this.teacherRepository.createFromDto(createTeacherDto);
  }

  async findAll(): Promise<Teacher[]> {
    return await this.teacherRepository.findAll({
      where: { is_deleted: false },
      relations: ['classes', 'levels'],
    });
  }

  async findOne(id: number): Promise<Teacher> {
    const teacher = await this.teacherRepository.findOne({
      where: { id, is_deleted: false },
      relations: ['classes', 'levels'],
    });

    if (!teacher) {
      throw new NotFoundException(`Teacher with ID ${id} not found`);
    }

    return teacher;
  }

  async findByName(teacherName: string): Promise<Teacher | null> {
    return await this.teacherRepository.findByNameWithCache(teacherName);
  }

  async bulkCreateTeachers(teacherNames: string[]): Promise<void> {
    await this.teacherRepository.bulkUpsertTeachers(teacherNames);
  }

  async update(id: number, updateTeacherDto: Partial<CreateTeacherDto>): Promise<Teacher> {
    await this.findOne(id); // Verify existence
    return await this.teacherRepository.update(id, {
      ...updateTeacherDto,
      updated_at: new Date()
    });
  }

  async softDelete(id: number): Promise<void> {
    await this.findOne(id); // Verify existence
    await this.teacherRepository.update(id, {
      is_deleted: true,
      deleted_at: new Date(),
      updated_at: new Date()
    });
  }

  async restore(id: number): Promise<Teacher> {
    const teacher = await this.teacherRepository.findOne({
      where: { id, is_deleted: true },
    });

    if (!teacher) {
      throw new NotFoundException(`Teacher with ID ${id} not found`);
    }

    return await this.teacherRepository.update(id, {
      is_deleted: false,
      deleted_at: null,
      updated_at: new Date()
    });
  }

  async getTeachersByLevel(teacherName: string): Promise<Teacher[]> {
    const teacher = await this.teacherRepository.findByNameWithCache(teacherName);

    if (!teacher) {
      return [];
    }

    return await this.teacherRepository.getTeachersByLevel(teacherName);
  }

  // Optimized methods for bulk operations
  async findTeachersByNames(teacherNames: string[]): Promise<Teacher[]> {
    return await this.teacherRepository.findTeachersByNames(teacherNames);
  }
}
