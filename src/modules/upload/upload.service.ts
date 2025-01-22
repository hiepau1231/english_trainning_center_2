import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import * as XLSX from 'xlsx';
import { Teacher } from '../teachers/entities/teacher.entity';
import { Class } from '../classes/entities/class.entity';
import { Schedule } from '../schedules/entities/schedule.entity';
import { Shift } from '../shifts/entities/shift.entity';
import { Level } from '../levels/entities/level.entity';
import { Classroom } from '../rooms/entities/classroom.entity';
import { Course } from '../courses/entities/course.entity';
import { ClassTeacher } from '../classes/entities/class-teacher.entity';
import { TeacherRole } from '../classes/enums/teacher-role.enum';

@Injectable()
export class UploadService {
  constructor(
    private dataSource: DataSource,
    @InjectRepository(Teacher)
    private teacherRepository: Repository<Teacher>,
    @InjectRepository(Class)
    private classRepository: Repository<Class>,
    @InjectRepository(Schedule)
    private scheduleRepository: Repository<Schedule>,
    @InjectRepository(Shift)
    private shiftRepository: Repository<Shift>,
    @InjectRepository(Level)
    private levelRepository: Repository<Level>,
    @InjectRepository(Classroom)
    private classroomRepository: Repository<Classroom>,
    @InjectRepository(Course)
    private courseRepository: Repository<Course>,
    @InjectRepository(ClassTeacher)
    private classTeacherRepository: Repository<ClassTeacher>,
  ) {}

  async uploadSchedule(file: Express.Multer.File) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const workbook = XLSX.read(file.buffer, { type: 'buffer' });
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const data = XLSX.utils.sheet_to_json(worksheet);
      const records = data.slice(1); // Bỏ qua dòng header

      for (const row of records) {
        const teachingShift = row['Thời gian'];
        const courseName = row['Tên khóa học'];
        const classroomName = row['Phòng học'];
        const className = row['Tên lớp'];
        const cmMain = row['CM chính'];
        const cmSub = row['CM phụ'];
        const capacity = row['Học viên trong lớp'];
        const startDate = new Date(row['Ngày bắt đầu'] * 1000);
        const endDate = new Date(row['Ngày kết thúc'] * 1000);

        // Tìm hoặc tạo Level
        let level;
        if (courseName) {
          level = await this.levelRepository.findOne({
            where: { level_name: courseName },
          });
          if (!level) {
            level = this.levelRepository.create({ level_name: courseName });
            await queryRunner.manager.save(level);
          }
        }

        // Tìm hoặc tạo Classroom
        let classroom;
        if (classroomName) {
          classroom = await this.classroomRepository.findOne({
            where: { room_name: classroomName },
          });
          if (!classroom) {
            classroom = this.classroomRepository.create({
              room_name: classroomName,
              capacity: capacity,
            });
            await queryRunner.manager.save(classroom);
          }
        }

        // Tìm hoặc tạo Course
        let course;
        if (courseName) {
          course = await this.courseRepository.findOne({
            where: { course_name: courseName },
          });
          if (!course) {
            course = this.courseRepository.create({ course_name: courseName });
            await queryRunner.manager.save(course);
          }
        }

        // Tìm hoặc tạo Class
        let classInstance;
        if (className) {
          classInstance = await this.classRepository.findOne({
            where: { class_name: className },
          });
          if (!classInstance) {
            classInstance = this.classRepository.create({
              class_name: className,
              start_date: startDate || null,
              end_date: endDate || null,
              classroom: classroom,
              course: course,
            });
            await queryRunner.manager.save(classInstance);
          }
        }

        // Xử lý giáo viên chính
        const cleanTeacherName = (teacherStr: string) =>
          teacherStr.replace(/\s*\(.*?\)\s*/g, '').trim();

        if (cmMain) {
          const cmMainTeachers = cmMain.split(' - ').map(cleanTeacherName);
          for (const teacherName of cmMainTeachers) {
            let teacher = await this.teacherRepository.findOne({
              where: { teacher_name: teacherName },
            });
            if (!teacher) {
              teacher = this.teacherRepository.create({
                teacher_name: teacherName,
              });
              await queryRunner.manager.save(teacher);
            }

            // Tạo quan hệ giáo viên-lớp với role
            const classTeacher = this.classTeacherRepository.create({
              class: classInstance,
              teacher: teacher,
              role: TeacherRole.MAIN,
            });
            await queryRunner.manager.save(classTeacher);
          }
        }

        // Xử lý giáo viên phụ
        if (cmSub) {
          const cmSubTeachers = cmSub.split(' - ').map(cleanTeacherName);
          for (const teacherName of cmSubTeachers) {
            let teacher = await this.teacherRepository.findOne({
              where: { teacher_name: teacherName },
            });
            if (!teacher) {
              teacher = this.teacherRepository.create({
                teacher_name: teacherName,
              });
              await queryRunner.manager.save(teacher);
            }

            // Tạo quan hệ giáo viên-lớp với role
            const classTeacher = this.classTeacherRepository.create({
              class: classInstance,
              teacher: teacher,
              role: TeacherRole.ASSISTANT,
            });
            await queryRunner.manager.save(classTeacher);
          }
        }

        // Xử lý ca học
        let shift = await this.shiftRepository.findOne({
          where: { teaching_shift: teachingShift },
        });
        if (!shift) {
          shift = this.shiftRepository.create({
            teaching_shift: teachingShift,
            class: classInstance,
          });
          await queryRunner.manager.save(shift);
        }

        // Xử lý lịch học
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
            const scheduleDate = key;
            let schedule = await this.scheduleRepository.findOne({
              where: { schedule_date: new Date(scheduleDate) },
            });

            if (!schedule) {
              schedule = this.scheduleRepository.create({
                schedule_date: new Date(scheduleDate),
                classroom: classroom,
              });
              await queryRunner.manager.save(schedule);
            }

            // Thêm quan hệ lịch học-lớp
            if (classInstance.schedules === undefined)
              classInstance.schedules = [];
            if (!classInstance.schedules.find((s) => s.id === schedule.id)) {
              classInstance.schedules.push(schedule);
            }

            // Thêm quan hệ ca học-lịch học
            if (schedule.shifts === undefined) schedule.shifts = [];
            if (!schedule.shifts.find((s) => s.id === shift.id)) {
              schedule.shifts.push(shift);
              await queryRunner.manager.save(schedule);
            }

            await queryRunner.manager.save(classInstance);
          }
        }
      }

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
}
