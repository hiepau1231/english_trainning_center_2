import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Class } from './entities/class.entity';
import { CreateClassDto } from './dto/create-class.dto';
import { UpdateClassDto } from './dto/update-class.dto';
import { ClassTeacher } from './entities/class-teacher.entity';

@Injectable()
export class ClassesService {
  constructor(
    @InjectRepository(Class)
    private classRepository: Repository<Class>,
    @InjectRepository(ClassTeacher)
    private classTeacherRepository: Repository<ClassTeacher>,
  ) {}

  async create(createClassDto: CreateClassDto) {
    const newClass = this.classRepository.create(createClassDto);
    return await this.classRepository.save(newClass);
  }

  async findAll() {
    return await this.classRepository.find({
      where: { is_deleted: false },
      relations: [
        'course',
        'classroom',
        'classTeachers',
        'classTeachers.teacher',
        'schedules',
        'shifts',
      ],
    });
  }

  async findOne(id: number) {
    const classEntity = await this.classRepository.findOne({
      where: { id, is_deleted: false },
      relations: [
        'course',
        'classroom',
        'classTeachers',
        'classTeachers.teacher',
        'schedules',
        'shifts',
      ],
    });

    if (!classEntity) {
      throw new NotFoundException(`Class with ID ${id} not found`);
    }

    return classEntity;
  }

  async update(id: number, updateClassDto: UpdateClassDto) {
    const classEntity = await this.findOne(id);
    Object.assign(classEntity, updateClassDto);
    return await this.classRepository.save(classEntity);
  }

  async softDelete(id: number) {
    const classEntity = await this.findOne(id);
    classEntity.is_deleted = true;
    classEntity.deleted_at = new Date();
    return await this.classRepository.save(classEntity);
  }

  async restore(id: number) {
    const classEntity = await this.classRepository.findOne({
      where: { id, is_deleted: true },
    });

    if (!classEntity) {
      throw new NotFoundException(`Class with ID ${id} not found`);
    }

    classEntity.is_deleted = false;
    classEntity.deleted_at = null;
    return await this.classRepository.save(classEntity);
  }

  async getDeletedClasses() {
    return await this.classRepository.find({
      where: { is_deleted: true },
      relations: ['course', 'classroom', 'teachers', 'schedules', 'shifts'],
    });
  }

  async findClassDetail(id: number) {
    const class_ = await this.classRepository
      .createQueryBuilder('class')
      .leftJoinAndSelect('class.classTeachers', 'classTeacher')
      .leftJoinAndSelect('classTeacher.teacher', 'teacher')
      .leftJoinAndSelect('class.course', 'course')
      .leftJoinAndSelect('class.schedules', 'schedule')
      .leftJoinAndSelect('class.shifts', 'shift')
      .leftJoinAndSelect('class.classroom', 'classroom')
      .leftJoinAndSelect('teacher.levels', 'teacher_level')
      .where('class.id = :id', { id })
      .andWhere('class.is_deleted = :isDeleted', { isDeleted: false })
      .getOne();

    if (!class_) {
      throw new NotFoundException(`Class with ID ${id} not found`);
    }

    return {
      class_name: class_.class_name,
      course_name: class_.course?.course_name,
      teachers: class_.classTeachers,
      schedules: class_.schedules?.map((s) => ({
        date: s.schedule_date,
      })),
      shifts: class_.shifts?.map((s) => s.teaching_shift),
      classroom: {
        name: class_.classroom?.room_name,
        capacity: class_.classroom?.capacity,
      },
      start_date: class_.start_date,
      end_date: class_.end_date,
    };
  }
}
