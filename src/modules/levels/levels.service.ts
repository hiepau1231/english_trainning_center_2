import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Level } from './entities/level.entity';
import { CreateLevelDto } from './dto/create-level.dto';

@Injectable()
export class LevelsService {
  constructor(
    @InjectRepository(Level)
    private levelRepository: Repository<Level>,
  ) {}

  async create(createLevelDto: CreateLevelDto) {
    const level = this.levelRepository.create(createLevelDto);
    return await this.levelRepository.save(level);
  }

  async findAll() {
    return await this.levelRepository.find({
      where: { is_deleted: false },
      relations: ['teachers'],
    });
  }

  async findOne(id: number) {
    const level = await this.levelRepository.findOne({
      where: { id, is_deleted: false },
      relations: ['teachers'],
    });

    if (!level) {
      throw new NotFoundException(`Level with ID ${id} not found`);
    }

    return level;
  }

  async update(id: number, updateLevelDto: Partial<CreateLevelDto>) {
    const level = await this.findOne(id);
    Object.assign(level, updateLevelDto);
    return await this.levelRepository.save(level);
  }

  async softDelete(id: number) {
    const level = await this.findOne(id);
    level.is_deleted = true;
    level.deleted_at = new Date();
    return await this.levelRepository.save(level);
  }

  async restore(id: number) {
    const level = await this.levelRepository.findOne({
      where: { id, is_deleted: true },
    });

    if (!level) {
      throw new NotFoundException(`Level with ID ${id} not found`);
    }

    level.is_deleted = false;
    level.deleted_at = null;
    return await this.levelRepository.save(level);
  }
}
