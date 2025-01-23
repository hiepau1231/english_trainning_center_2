import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, FindManyOptions } from 'typeorm';
import { BaseRepository } from '../../../common/repositories/base.repository';
import { Course, CourseStatus } from '../entities/course.entity';
import { CreateCourseDto } from '../dto/create-course.dto';

@Injectable()
export class CourseRepository extends BaseRepository<Course> {
  private readonly COURSE_CACHE_PREFIX = 'course';
  private readonly COURSE_LIST_CACHE_KEY = 'course:list';
  private readonly CACHE_TTL = 3600000; // 1 hour

  constructor(
    @InjectRepository(Course)
    private readonly courseRepository: Repository<Course>
  ) {
    super(courseRepository);
  }

  /**
   * Find course by name with caching
   */
  async findByNameWithCache(courseName: string): Promise<Course | null> {
    return this.findOne({
      where: { course_name: courseName },
      cache: {
        id: `${this.COURSE_CACHE_PREFIX}:name:${courseName}`,
        milliseconds: this.CACHE_TTL
      }
    });
  }

  /**
   * Find course with all its classes
   */
  async findWithClasses(id: number): Promise<Course | null> {
    return this.findOne({
      where: { id },
      relations: ['classes', 'classes.classTeachers', 'classes.classTeachers.teacher'],
      cache: {
        id: `${this.COURSE_CACHE_PREFIX}:full:${id}`,
        milliseconds: this.CACHE_TTL / 4 // 15 minutes for detailed views
      }
    });
  }

  /**
   * Find all active courses
   */
  async findActiveCourses(options?: FindManyOptions<Course>): Promise<Course[]> {
    return this.findAll({
      ...options,
      where: {
        ...(options?.where || {}),
        is_deleted: false,
        status: CourseStatus.ACTIVE
      },
      cache: {
        id: `${this.COURSE_LIST_CACHE_KEY}:active`,
        milliseconds: this.CACHE_TTL / 2 // 30 minutes for active courses list
      }
    });
  }

  /**
   * Create a new course from DTO
   */
  async createFromDto(createCourseDto: CreateCourseDto): Promise<Course> {
    const course = this.courseRepository.create(createCourseDto);
    const saved = await this.create(course);
    await this.clearCache();
    return saved;
  }

  /**
   * Create multiple courses in bulk
   */
  async bulkCreateCourses(courses: CreateCourseDto[]): Promise<void> {
    if (!courses.length) return;

    const queryRunner = this.courseRepository.manager.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Create courses in batches
      const coursesToCreate = courses.map(course => this.courseRepository.create(course));
      await queryRunner.manager.save(coursesToCreate);
      
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
   * Update course status in bulk
   */
  async bulkUpdateStatus(
    courseIds: number[],
    status: CourseStatus
  ): Promise<void> {
    if (!courseIds.length) return;

    await this.courseRepository.update(
      { id: In(courseIds) },
      { status, updated_at: new Date() }
    );
    
    await this.clearCache();
  }

  /**
   * Find courses by multiple IDs with classes
   */
  async findByIds(ids: number[]): Promise<Course[]> {
    return this.findAll({
      where: { id: In(ids) },
      relations: ['classes'],
      cache: {
        id: `${this.COURSE_CACHE_PREFIX}:ids:${ids.join(',')}`,
        milliseconds: this.CACHE_TTL
      }
    });
  }

  /**
   * Find courses by status
   */
  async findByStatus(status: CourseStatus): Promise<Course[]> {
    return this.findAll({
      where: { status, is_deleted: false },
      cache: {
        id: `${this.COURSE_CACHE_PREFIX}:status:${status}`,
        milliseconds: this.CACHE_TTL / 2 // 30 minutes for status-based queries
      }
    });
  }
}