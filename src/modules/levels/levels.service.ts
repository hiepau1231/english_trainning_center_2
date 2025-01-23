import { Injectable, NotFoundException } from '@nestjs/common';
import { Level } from './entities/level.entity';
import { CreateLevelDto } from './dto/create-level.dto';
import { LevelRepository } from './repositories/level.repository';

interface TeacherLevelAssignment {
  level_id: number;
  teacher_id: number;
}

@Injectable()
export class LevelsService {
  constructor(
    private readonly levelRepository: LevelRepository,
  ) {}

  async create(createLevelDto: CreateLevelDto) {
    return await this.levelRepository.createFromDto(createLevelDto);
  }

  async bulkCreate(createLevelDtos: CreateLevelDto[]) {
    return await this.levelRepository.bulkCreateLevels(createLevelDtos);
  }

  async findAll() {
    return await this.levelRepository.findActiveLevels();
  }

  async findOne(id: number) {
    const level = await this.levelRepository.findWithTeachers(id);

    if (!level) {
      throw new NotFoundException(`Level with ID ${id} not found`);
    }

    return level;
  }

  async findByName(levelName: string) {
    return await this.levelRepository.findByNameWithCache(levelName);
  }

  async update(id: number, updateLevelDto: Partial<CreateLevelDto>) {
    await this.findOne(id); // Verify exists
    return await this.levelRepository.update(id, updateLevelDto);
  }

  async softDelete(id: number) {
    await this.findOne(id); // Verify exists
    await this.levelRepository.softDelete(id);
  }

  async restore(id: number) {
    const level = await this.levelRepository.findOne({
      where: { id, is_deleted: true }
    });

    if (!level) {
      throw new NotFoundException(`Level with ID ${id} not found`);
    }

    return await this.levelRepository.restore(id);
  }

  async assignTeachers(assignments: TeacherLevelAssignment[]) {
    return await this.levelRepository.bulkAssignTeachers(assignments);
  }

  async findMultiple(ids: number[]) {
    return await this.levelRepository.findByIds(ids);
  }

  async getTeacherCount(levelId: number) {
    return await this.levelRepository.getTeacherCountByLevel(levelId);
  }
}
