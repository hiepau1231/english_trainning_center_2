import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Course } from './entities/course.entity';
import { CreateCourseDto } from './dto/create-course.dto';

@Injectable()
export class CoursesService {
  constructor(
    @InjectRepository(Course)
    private courseRepository: Repository<Course>,
  ) {}

  async create(createCourseDto: CreateCourseDto) {
    const course = this.courseRepository.create(createCourseDto);
    return await this.courseRepository.save(course);
  }

  async findAll() {
    return await this.courseRepository.find({
      where: { is_deleted: false },
      relations: ['classes'],
    });
  }

  async findOne(id: number) {
    const course = await this.courseRepository.findOne({
      where: { id, is_deleted: false },
      relations: ['classes'],
    });

    if (!course) {
      throw new NotFoundException(`Course with ID ${id} not found`);
    }

    return course;
  }

  async update(id: number, updateCourseDto: Partial<CreateCourseDto>) {
    const course = await this.findOne(id);
    Object.assign(course, updateCourseDto);
    return await this.courseRepository.save(course);
  }

  async softDelete(id: number) {
    const course = await this.findOne(id);
    course.is_deleted = true;
    course.deleted_at = new Date();
    return await this.courseRepository.save(course);
  }

  async restore(id: number) {
    const course = await this.courseRepository.findOne({
      where: { id, is_deleted: true },
    });

    if (!course) {
      throw new NotFoundException(`Course with ID ${id} not found`);
    }

    course.is_deleted = false;
    course.deleted_at = null;
    return await this.courseRepository.save(course);
  }
}
