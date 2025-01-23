import { Injectable, NotFoundException } from '@nestjs/common';
import { Course, CourseStatus } from './entities/course.entity';
import { CreateCourseDto } from './dto/create-course.dto';
import { CourseRepository } from './repositories/course.repository';

@Injectable()
export class CoursesService {
  constructor(
    private readonly courseRepository: CourseRepository,
  ) {}

  async create(createCourseDto: CreateCourseDto) {
    return await this.courseRepository.createFromDto(createCourseDto);
  }

  async bulkCreate(createCourseDtos: CreateCourseDto[]) {
    return await this.courseRepository.bulkCreateCourses(createCourseDtos);
  }

  async findAll() {
    return await this.courseRepository.findActiveCourses();
  }

  async findOne(id: number) {
    const course = await this.courseRepository.findWithClasses(id);

    if (!course) {
      throw new NotFoundException(`Course with ID ${id} not found`);
    }

    return course;
  }

  async findByName(courseName: string) {
    return await this.courseRepository.findByNameWithCache(courseName);
  }

  async update(id: number, updateCourseDto: Partial<CreateCourseDto>) {
    await this.findOne(id); // Verify exists
    return await this.courseRepository.update(id, updateCourseDto);
  }

  async updateStatus(id: number, status: CourseStatus) {
    await this.findOne(id); // Verify exists
    return await this.courseRepository.update(id, { status });
  }

  async bulkUpdateStatus(courseIds: number[], status: CourseStatus) {
    return await this.courseRepository.bulkUpdateStatus(courseIds, status);
  }

  async softDelete(id: number) {
    await this.findOne(id); // Verify exists
    await this.courseRepository.softDelete(id);
  }

  async restore(id: number) {
    const course = await this.courseRepository.findOne({
      where: { id, is_deleted: true }
    });

    if (!course) {
      throw new NotFoundException(`Course with ID ${id} not found`);
    }

    return await this.courseRepository.restore(id);
  }

  async findByStatus(status: CourseStatus) {
    return await this.courseRepository.findByStatus(status);
  }

  async findMultiple(ids: number[]) {
    return await this.courseRepository.findByIds(ids);
  }
}
