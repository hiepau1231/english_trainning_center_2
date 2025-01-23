import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindManyOptions, FindOneOptions, In } from 'typeorm';
import { BaseRepository } from '../../../common/repositories/base.repository';
import { Class } from '../entities/class.entity';
import { CreateClassDto } from '../dto/create-class.dto';
import { ClassTeacher } from '../entities/class-teacher.entity';
import { TeacherRole } from '../enums/teacher-role.enum';

interface ClassTeacherDto {
  class_id: number;
  teacher_id: number;
  role: TeacherRole;
}

@Injectable()
export class ClassRepository extends BaseRepository<Class> {
  private readonly CLASS_CACHE_PREFIX = 'class';
  private readonly CLASS_LIST_CACHE_KEY = 'class:list';
  private readonly CACHE_TTL = 60000; // 1 minute

  constructor(
    @InjectRepository(Class)
    private readonly classRepository: Repository<Class>,
    @InjectRepository(ClassTeacher)
    private readonly classTeacherRepository: Repository<ClassTeacher>
  ) {
    super(classRepository);
  }

  /**
   * Find class by name with caching
   */
  async findByNameWithCache(className: string): Promise<Class | null> {
    return this.findOne({
      where: { class_name: className },
      cache: {
        id: `${this.CLASS_CACHE_PREFIX}:name:${className}`,
        milliseconds: this.CACHE_TTL
      }
    });
  }

  /**
   * Find class with all its relationships
   */
  async findWithRelations(id: number): Promise<Class | null> {
    return this.findOne({
      where: { id },
      relations: [
        'course',
        'classroom',
        'classTeachers',
        'classTeachers.teacher',
        'schedules',
        'shifts'
      ],
      cache: {
        id: `${this.CLASS_CACHE_PREFIX}:full:${id}`,
        milliseconds: this.CACHE_TTL
      }
    });
  }

  /**
   * Find all active classes
   */
  async findActiveClasses(options?: FindManyOptions<Class>): Promise<Class[]> {
    return this.findAll({
      ...options,
      where: {
        ...(options?.where || {}),
        is_deleted: false
      },
      cache: {
        id: `${this.CLASS_LIST_CACHE_KEY}:active`,
        milliseconds: this.CACHE_TTL
      }
    });
  }

  /**
   * Create a new class from DTO with relationships
   */
  async createFromDto(createClassDto: CreateClassDto): Promise<Class> {
    const { teachers, teacher_ids, schedule_ids, ...classData } = createClassDto;

    // Start transaction
    const queryRunner = this.classRepository.manager.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Create class
      const classEntity = this.classRepository.create(classData);
      const savedClass = await queryRunner.manager.save(Class, classEntity);

      // Handle teacher assignments
      if (teachers?.length) {
        const classTeachers = teachers.map(teacher => ({
          class_id: savedClass.id,
          teacher_id: teacher.teacher_id,
          role: teacher.role
        }));
        await this.bulkAssignTeachers(classTeachers, queryRunner);
      } else if (teacher_ids?.length) {
        const classTeachers = teacher_ids.map(teacherId => ({
          class_id: savedClass.id,
          teacher_id: teacherId,
          role: TeacherRole.MAIN
        }));
        await this.bulkAssignTeachers(classTeachers, queryRunner);
      }

      // Handle schedule assignments
      if (schedule_ids?.length) {
        savedClass.schedules = schedule_ids.map(id => ({ id } as any));
        await queryRunner.manager.save(Class, savedClass);
      }

      await queryRunner.commitTransaction();
      await this.clearCache();
      
      return this.findWithRelations(savedClass.id);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Create multiple classes in bulk
   */
  async bulkCreateClasses(classes: CreateClassDto[]): Promise<void> {
    const queryRunner = this.classRepository.manager.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      for (const classDto of classes) {
        const { teachers, teacher_ids, schedule_ids, ...classData } = classDto;
        
        // Create class
        const classEntity = this.classRepository.create(classData);
        const savedClass = await queryRunner.manager.save(Class, classEntity);

        // Handle teacher assignments
        if (teachers?.length) {
          const classTeachers = teachers.map(teacher => ({
            class_id: savedClass.id,
            teacher_id: teacher.teacher_id,
            role: teacher.role
          }));
          await this.bulkAssignTeachers(classTeachers, queryRunner);
        } else if (teacher_ids?.length) {
          const classTeachers = teacher_ids.map(teacherId => ({
            class_id: savedClass.id,
            teacher_id: teacherId,
            role: TeacherRole.MAIN
          }));
          await this.bulkAssignTeachers(classTeachers, queryRunner);
        }

        // Handle schedule assignments
        if (schedule_ids?.length) {
          savedClass.schedules = schedule_ids.map(id => ({ id } as any));
          await queryRunner.manager.save(Class, savedClass);
        }
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
   * Assign teachers to classes in bulk
   */
  async bulkAssignTeachers(
    assignments: ClassTeacherDto[],
    queryRunner?: any
  ): Promise<void> {
    const manager = queryRunner?.manager || this.classTeacherRepository.manager;

    // Create values for bulk insert
    const values = assignments.map(assignment => ({
      class_id: assignment.class_id,
      teacher_id: assignment.teacher_id,
      role: assignment.role
    }));

    // Perform bulk upsert
    await manager
      .createQueryBuilder()
      .insert()
      .into(ClassTeacher)
      .values(values)
      .orUpdate(['role'], ['class_id', 'teacher_id'])
      .execute();

    if (!queryRunner) {
      await this.clearCache();
    }
  }

  /**
   * Find classes by multiple IDs with relations
   */
  async findByIds(ids: number[]): Promise<Class[]> {
    return this.findAll({
      where: { id: In(ids) },
      relations: [
        'course',
        'classroom',
        'classTeachers',
        'classTeachers.teacher',
        'schedules',
        'shifts'
      ],
      cache: {
        id: `${this.CLASS_CACHE_PREFIX}:ids:${ids.join(',')}`,
        milliseconds: this.CACHE_TTL
      }
    });
  }
}