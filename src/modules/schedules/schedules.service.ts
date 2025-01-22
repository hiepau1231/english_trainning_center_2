import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Schedule } from './entities/schedule.entity';
import { CreateScheduleDto } from './dto/create-schedule.dto';
import { Classroom } from '../rooms/entities/classroom.entity';

@Injectable()
export class SchedulesService {
  constructor(
    @InjectRepository(Schedule)
    private scheduleRepository: Repository<Schedule>,
    @InjectRepository(Classroom)
    private classroomRepository: Repository<Classroom>,
  ) {}

  async create(createScheduleDto: CreateScheduleDto) {
    const schedule = this.scheduleRepository.create(createScheduleDto);
    return await this.scheduleRepository.save(schedule);
  }

  async findAll() {
    return await this.scheduleRepository.find({
      where: { is_deleted: false },
      relations: ['classroom', 'classes', 'shifts'],
    });
  }

  async findOne(id: number) {
    const schedule = await this.scheduleRepository.findOne({
      where: { id, is_deleted: false },
      relations: ['classroom', 'classes', 'shifts'],
    });

    if (!schedule) {
      throw new NotFoundException(`Schedule with ID ${id} not found`);
    }

    return schedule;
  }

  async update(id: number, updateScheduleDto: Partial<CreateScheduleDto>) {
    const schedule = await this.findOne(id);
    Object.assign(schedule, updateScheduleDto);
    return await this.scheduleRepository.save(schedule);
  }

  async softDelete(id: number) {
    const schedule = await this.findOne(id);
    schedule.is_deleted = true;
    schedule.deleted_at = new Date();
    return await this.scheduleRepository.save(schedule);
  }

  async restore(id: number) {
    const schedule = await this.scheduleRepository.findOne({
      where: { id, is_deleted: true },
    });

    if (!schedule) {
      throw new NotFoundException(`Schedule with ID ${id} not found`);
    }

    schedule.is_deleted = false;
    schedule.deleted_at = null;
    return await this.scheduleRepository.save(schedule);
  }

  async findSchedulesByDateOrRoom(date?: string, classroom_name?: string) {
    const queryBuilder = this.scheduleRepository
      .createQueryBuilder('schedule')
      .leftJoinAndSelect('schedule.classroom', 'classroom')
      .innerJoinAndSelect('schedule.classes', 'class')
      .leftJoinAndSelect('class.classTeachers', 'classTeacher')
      .leftJoinAndSelect('classTeacher.teacher', 'teacher')
      .leftJoinAndSelect('schedule.shifts', 'shift')
      .leftJoinAndSelect('class.course', 'course')
      .where('schedule.is_deleted = :isDeleted', { isDeleted: false });

    if (date) {
      queryBuilder.andWhere(
        "DATE_FORMAT(schedule.schedule_date, '%Y-%m-%d') = :date",
        { date },
      );
    }

    if (classroom_name) {
      queryBuilder.andWhere('classroom.room_name = :classroom_name', {
        classroom_name,
      });
    }

    queryBuilder
      .andWhere('classroom.id IS NOT NULL')
      .andWhere('class.id IS NOT NULL');

    console.log('Query:', queryBuilder.getSql());
    console.log('Parameters:', queryBuilder.getParameters());

    const schedules = await queryBuilder.getMany();

    return schedules
      .filter((schedule) => {
        return (
          schedule.classroom && schedule.classes && schedule.classes.length > 0
        );
      })
      .map((schedule) => ({
        date: schedule.schedule_date,
        classroom: schedule.classroom.room_name,
        classes:
          // schedule.classes.map((class_) => ({
          //   class_name: class_.class_name,
          //   course: class_.course?.course_name,
          //   teachers:
          //     class_.classTeachers?.map((ct) => ({
          //       name: ct.teacher.teacher_name,
          //       is_foreign: ct.teacher.is_foreign,
          //       role: ct.role,
          //     })) || [],
          //   shifts: schedule.shifts?.map((shift) => shift.teaching_shift) || [],
          //   ...class_,
          // })),
          schedule.classes,
      }));
  }
}
