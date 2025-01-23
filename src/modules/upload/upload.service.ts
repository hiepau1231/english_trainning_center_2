import { Injectable, BadRequestException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import * as XLSX from 'xlsx';
import { TeachersService } from '../teachers/teachers.service';
import { ClassRepository } from '../classes/repositories/class.repository';
import { Class } from '../classes/entities/class.entity';
import { Schedule } from '../schedules/entities/schedule.entity';
import { Shift } from '../shifts/entities/shift.entity';
import { Level } from '../levels/entities/level.entity';
import { Classroom } from '../rooms/entities/classroom.entity';
import { Course } from '../courses/entities/course.entity';
import { ClassTeacher } from '../classes/entities/class-teacher.entity';
import { TeacherRole } from '../classes/enums/teacher-role.enum';

interface ScheduleRow {
  'Thời gian': string;
  'Tên khóa học': string;
  'Phòng học': string;
  'Tên lớp': string;
  'CM chính': string;
  'CM phụ': string;
  'Học viên trong lớp': number;
  'Ngày bắt đầu': number;
  'Ngày kết thúc': number;
  [key: string]: any;
}

@Injectable()
export class UploadService {
  constructor(
    private dataSource: DataSource,
    private teachersService: TeachersService,
    private classRepository: ClassRepository,
  ) {}

  async uploadSchedule(file: Express.Multer.File) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const workbook = XLSX.read(file.buffer, { type: 'buffer' });
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const data = XLSX.utils.sheet_to_json(worksheet) as ScheduleRow[];
      const records = data.slice(1); // Skip header

      // Collect all unique values for bulk operations
      const uniqueValues = this.extractUniqueValues(records);

      // Bulk create/update operations
      await this.processLevelsAndCourses(queryRunner, uniqueValues);
      await this.processClassrooms(queryRunner, uniqueValues);
      await this.processTeachers(uniqueValues);
      await this.processClasses(queryRunner, records, uniqueValues);

      await queryRunner.commitTransaction();
      return { message: 'Upload schedule successfully' };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw new BadRequestException(
        `Failed to upload schedule: ${error.message}`,
      );
    } finally {
      await queryRunner.release();
    }
  }

  private extractUniqueValues(records: ScheduleRow[]) {
    const uniqueValues = {
      courseNames: new Set<string>(),
      classroomNames: new Set<string>(),
      teacherNames: new Set<string>(),
      classNames: new Set<string>(),
    };

    for (const row of records) {
      if (row['Tên khóa học']) uniqueValues.courseNames.add(row['Tên khóa học']);
      if (row['Phòng học']) uniqueValues.classroomNames.add(row['Phòng học']);
      if (row['Tên lớp']) uniqueValues.classNames.add(row['Tên lớp']);
      
      // Process main teachers
      if (row['CM chính']) {
        const mainTeachers = this.cleanTeacherNames(row['CM chính']);
        mainTeachers.forEach(name => uniqueValues.teacherNames.add(name));
      }

      // Process assistant teachers
      if (row['CM phụ']) {
        const assistantTeachers = this.cleanTeacherNames(row['CM phụ']);
        assistantTeachers.forEach(name => uniqueValues.teacherNames.add(name));
      }
    }

    return uniqueValues;
  }

  private cleanTeacherNames(teacherStr: string): string[] {
    return teacherStr
      .split(' - ')
      .map(name => name.replace(/\s*\(.*?\)\s*/g, '').trim());
  }

  private async processLevelsAndCourses(
    queryRunner: any,
    uniqueValues: { courseNames: Set<string> }
  ) {
    const coursesToCreate = Array.from(uniqueValues.courseNames).map(name => ({
      course_name: name
    }));

    if (coursesToCreate.length > 0) {
      await queryRunner.manager
        .createQueryBuilder()
        .insert()
        .into(Course)
        .values(coursesToCreate)
        .orIgnore()
        .execute();

      // Create corresponding levels
      await queryRunner.manager
        .createQueryBuilder()
        .insert()
        .into(Level)
        .values(coursesToCreate.map(course => ({
          level_name: course.course_name
        })))
        .orIgnore()
        .execute();
    }
  }

  private async processClassrooms(
    queryRunner: any,
    uniqueValues: { classroomNames: Set<string> }
  ) {
    const classroomsToCreate = Array.from(uniqueValues.classroomNames).map(name => ({
      room_name: name
    }));

    if (classroomsToCreate.length > 0) {
      await queryRunner.manager
        .createQueryBuilder()
        .insert()
        .into(Classroom)
        .values(classroomsToCreate)
        .orIgnore()
        .execute();
    }
  }

  private async processTeachers(
    uniqueValues: { teacherNames: Set<string> }
  ) {
    const teacherNames = Array.from(uniqueValues.teacherNames);
    if (teacherNames.length > 0) {
      await this.teachersService.bulkCreateTeachers(teacherNames);
    }
  }

  private async processClasses(
    queryRunner: any,
    records: ScheduleRow[],
    uniqueValues: { classNames: Set<string> }
  ) {
    // Prepare classes with full details
    const classesMap = new Map<string, any>();
    
    for (const row of records) {
      const className = row['Tên lớp'];
      if (!classesMap.has(className)) {
        const [course, classroom] = await Promise.all([
          queryRunner.manager.findOne(Course, {
            where: { course_name: row['Tên khóa học'] }
          }),
          queryRunner.manager.findOne(Classroom, {
            where: { room_name: row['Phòng học'] }
          })
        ]);

        classesMap.set(className, {
          class_name: className,
          course_id: course?.id,
          classroom_id: classroom?.id,
          start_date: row['Ngày bắt đầu'] ? new Date(row['Ngày bắt đầu'] * 1000) : null,
          end_date: row['Ngày kết thúc'] ? new Date(row['Ngày kết thúc'] * 1000) : null
        });
      }
    }

    // Bulk create classes using repository
    this.classRepository.useTransaction(queryRunner);
    await this.classRepository.bulkCreateClasses(Array.from(classesMap.values()));

    // Process relationships for each class
    for (const row of records) {
      const classInstance = await this.classRepository.findByNameWithCache(row['Tên lớp']);
      
      if (classInstance) {
        // Process teachers using bulk operations
        await this.processClassTeachers(queryRunner, classInstance, row);
        
        // Process schedules
        await this.processClassSchedules(queryRunner, classInstance, row);
      }
    }
  }

  private async processClassTeachers(
    queryRunner: any,
    classInstance: Class,
    row: ScheduleRow
  ) {
    const teacherAssignments = [];

    // Process main teachers
    if (row['CM chính']) {
      const mainTeachers = await this.teachersService.findTeachersByNames(
        this.cleanTeacherNames(row['CM chính'])
      );

      teacherAssignments.push(
        ...mainTeachers.map(teacher => ({
          class_id: classInstance.id,
          teacher_id: teacher.id,
          role: TeacherRole.MAIN
        }))
      );
    }

    // Process assistant teachers
    if (row['CM phụ']) {
      const assistantTeachers = await this.teachersService.findTeachersByNames(
        this.cleanTeacherNames(row['CM phụ'])
      );

      teacherAssignments.push(
        ...assistantTeachers.map(teacher => ({
          class_id: classInstance.id,
          teacher_id: teacher.id,
          role: TeacherRole.ASSISTANT
        }))
      );
    }

    // Bulk assign teachers if any
    if (teacherAssignments.length > 0) {
      await this.classRepository.bulkAssignTeachers(teacherAssignments, queryRunner);
    }
  }

  private async processClassSchedules(
    queryRunner: any,
    classInstance: Class,
    row: ScheduleRow
  ) {
    // Create or get shift
    let shift = await queryRunner.manager.findOne(Shift, {
      where: { teaching_shift: row['Thời gian'] }
    });

    if (!shift) {
      shift = await queryRunner.manager.save(
        queryRunner.manager.create(Shift, {
          teaching_shift: row['Thời gian'],
          class: classInstance
        })
      );
    }

    // Process schedules
    for (const [key, value] of Object.entries(row)) {
      if (
        ![
          'STT',
          'Thời gian',
          'Tên khóa học',
          'Tên lớp',
          'CM chính',
          'CM phụ',
          'Học viên trong lớp',
          'Ngày bắt đầu',
          'Ngày kết thúc',
          'Phòng học',
        ].includes(key)
      ) {
        // Create schedule
        await queryRunner.manager
          .createQueryBuilder()
          .insert()
          .into(Schedule)
          .values({
            schedule_date: new Date(key),
            classroom: classInstance.classroom,
            shifts: [shift],
            classes: [classInstance]
          })
          .orIgnore()
          .execute();
      }
    }
  }
}
