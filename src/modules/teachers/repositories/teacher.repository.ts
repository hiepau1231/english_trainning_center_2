import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere, In } from 'typeorm';
import { Teacher } from '../entities/teacher.entity';
import { BaseRepository } from '../../../common/repositories/base.repository';
import { CreateTeacherDto } from '../dto/create-teacher.dto';

@Injectable()
export class TeacherRepository extends BaseRepository<Teacher> {
    constructor(
        @InjectRepository(Teacher)
        private readonly teacherRepository: Repository<Teacher>
    ) {
        super(teacherRepository);
    }

    /**
     * Find a teacher by name with caching
     */
    async findByNameWithCache(teacherName: string): Promise<Teacher | null> {
        return await this.findWithCache({
            where: { 
                teacher_name: teacherName,
                is_deleted: false
            } as FindOptionsWhere<Teacher>
        });
    }

    /**
     * Creates a new teacher from DTO
     */
    async createFromDto(createTeacherDto: CreateTeacherDto): Promise<Teacher> {
        return await this.create({
            ...createTeacherDto,
            is_deleted: false,
            created_at: new Date(),
            updated_at: new Date()
        });
    }

    /**
     * Bulk create or update teachers by names
     */
    async bulkUpsertTeachers(teacherNames: string[]): Promise<void> {
        if (teacherNames.length === 0) return;

        const teachers = teacherNames.map(name => ({
            teacher_name: name,
            is_deleted: false,
            created_at: new Date(),
            updated_at: new Date()
        }));

        await this.bulkUpsert(teachers, ['teacher_name']);
    }

    /**
     * Find multiple teachers by their names
     */
    async findTeachersByNames(teacherNames: string[]): Promise<Teacher[]> {
        if (teacherNames.length === 0) return [];

        return await this.findAllWithCache({
            where: {
                teacher_name: In(teacherNames),
                is_deleted: false
            } as FindOptionsWhere<Teacher>
        });
    }

    /**
     * Get teachers by level with caching
     */
    async getTeachersByLevel(excludeTeacherName: string): Promise<Teacher[]> {
        return await this.findAllWithCache({
            relations: ['levels'],
            where: {
                teacher_name: excludeTeacherName,
                is_deleted: false
            } as FindOptionsWhere<Teacher>
        });
    }
}