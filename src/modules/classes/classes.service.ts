import { Injectable, NotFoundException } from '@nestjs/common';
import { Class } from './entities/class.entity';
import { CreateClassDto } from './dto/create-class.dto';
import { UpdateClassDto } from './dto/update-class.dto';
import { ClassRepository } from './repositories/class.repository';

@Injectable()
export class ClassesService {
  constructor(
    private readonly classRepository: ClassRepository,
  ) {}

  async create(createClassDto: CreateClassDto) {
    return await this.classRepository.createFromDto(createClassDto);
  }

  async bulkCreate(createClassDtos: CreateClassDto[]) {
    return await this.classRepository.bulkCreateClasses(createClassDtos);
  }

  async findAll() {
    return await this.classRepository.findActiveClasses();
  }

  async findOne(id: number) {
    const classEntity = await this.classRepository.findWithRelations(id);

    if (!classEntity) {
      throw new NotFoundException(`Class with ID ${id} not found`);
    }

    return classEntity;
  }

  async update(id: number, updateClassDto: UpdateClassDto) {
    const classEntity = await this.findOne(id);
    return await this.classRepository.update(id, updateClassDto);
  }

  async softDelete(id: number) {
    await this.findOne(id); // Verify exists
    await this.classRepository.softDelete(id);
  }

  async restore(id: number) {
    const classEntity = await this.classRepository.findOne({
      where: { id, is_deleted: true }
    });

    if (!classEntity) {
      throw new NotFoundException(`Class with ID ${id} not found`);
    }

    return await this.classRepository.restore(id);
  }

  async getDeletedClasses() {
    return await this.classRepository.findAll({
      where: { is_deleted: true },
      relations: [
        'course',
        'classroom',
        'classTeachers',
        'classTeachers.teacher',
        'schedules',
        'shifts'
      ]
    });
  }

  async findClassDetail(id: number) {
    const class_ = await this.classRepository.findWithRelations(id);

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

  async findByName(className: string) {
    return await this.classRepository.findByNameWithCache(className);
  }
}
