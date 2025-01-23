import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, FindManyOptions } from 'typeorm';
import { BaseRepository } from '../../../common/repositories/base.repository';
import { Level } from '../entities/level.entity';
import { CreateLevelDto } from '../dto/create-level.dto';
import { Teacher } from '../../teachers/entities/teacher.entity';

interface TeacherLevelAssignment {
  level_id: number;
  teacher_id: number;
}

@Injectable()
export class LevelRepository extends BaseRepository<Level> {
  private readonly LEVEL_CACHE_PREFIX = 'level';
  private readonly LEVEL_LIST_CACHE_KEY = 'level:list';
  private readonly CACHE_TTL = 3600000; // 1 hour

  constructor(
    @InjectRepository(Level)
    private readonly levelRepository: Repository<Level>
  ) {
    super(levelRepository);
  }

  /**
   * Find level by name with caching
   */
  async findByNameWithCache(levelName: string): Promise<Level | null> {
    return this.findOne({
      where: { level_name: levelName },
      cache: {
        id: `${this.LEVEL_CACHE_PREFIX}:name:${levelName}`,
        milliseconds: this.CACHE_TTL
      }
    });
  }

  /**
   * Find level with all its teachers
   */
  async findWithTeachers(id: number): Promise<Level | null> {
    return this.findOne({
      where: { id },
      relations: ['teachers'],
      cache: {
        id: `${this.LEVEL_CACHE_PREFIX}:teachers:${id}`,
        milliseconds: this.CACHE_TTL / 2 // 30 minutes for teacher relationships
      }
    });
  }

  /**
   * Find all active levels
   */
  async findActiveLevels(options?: FindManyOptions<Level>): Promise<Level[]> {
    return this.findAll({
      ...options,
      where: {
        ...(options?.where || {}),
        is_deleted: false
      },
      cache: {
        id: `${this.LEVEL_LIST_CACHE_KEY}:active`,
        milliseconds: this.CACHE_TTL
      }
    });
  }

  /**
   * Create a new level from DTO
   */
  async createFromDto(createLevelDto: CreateLevelDto): Promise<Level> {
    const level = this.levelRepository.create(createLevelDto);
    const saved = await this.create(level);
    await this.clearCache();
    return saved;
  }

  /**
   * Create multiple levels in bulk
   */
  async bulkCreateLevels(levels: CreateLevelDto[]): Promise<void> {
    if (!levels.length) return;

    const queryRunner = this.levelRepository.manager.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Create levels in batches
      const levelsToCreate = levels.map(level => this.levelRepository.create(level));
      await queryRunner.manager.save(levelsToCreate);
      
      await queryRunner.commitTransaction();
      await this.clearCache();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Assign teachers to levels in bulk
   */
  async bulkAssignTeachers(assignments: TeacherLevelAssignment[]): Promise<void> {
    if (!assignments.length) return;

    const queryRunner = this.levelRepository.manager.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      for (const batch of this.chunkArray(assignments, 100)) {
        const levels = await this.findByIds(
          Array.from(new Set(batch.map(a => a.level_id)))
        );
        const teachers = await queryRunner.manager.findBy(Teacher, {
          id: In(Array.from(new Set(batch.map(a => a.teacher_id))))
        });

        // Create a map for quick lookups
        const levelMap = new Map(levels.map(l => [l.id, l]));
        const teacherMap = new Map(teachers.map(t => [t.id, t]));

        // Process assignments
        for (const assignment of batch) {
          const level = levelMap.get(assignment.level_id);
          const teacher = teacherMap.get(assignment.teacher_id);

          if (level && teacher) {
            if (!level.teachers) level.teachers = [];
            if (!level.teachers.find(t => t.id === teacher.id)) {
              level.teachers.push(teacher);
            }
          }
        }

        // Save updated levels
        await queryRunner.manager.save(levels);
      }

      await queryRunner.commitTransaction();
      await this.clearCache();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Find levels by multiple IDs with teachers
   */
  async findByIds(ids: number[]): Promise<Level[]> {
    return this.findAll({
      where: { id: In(ids) },
      relations: ['teachers'],
      cache: {
        id: `${this.LEVEL_CACHE_PREFIX}:ids:${ids.join(',')}`,
        milliseconds: this.CACHE_TTL
      }
    });
  }

  /**
   * Get teacher count by level
   */
  async getTeacherCountByLevel(levelId: number): Promise<number> {
    const level = await this.findOne({
      where: { id: levelId },
      relations: ['teachers'],
      cache: {
        id: `${this.LEVEL_CACHE_PREFIX}:teacherCount:${levelId}`,
        milliseconds: this.CACHE_TTL / 4 // 15 minutes for counts
      }
    });

    return level?.teachers?.length || 0;
  }

  /**
   * Utility method to chunk array into smaller pieces
   */
  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }
}