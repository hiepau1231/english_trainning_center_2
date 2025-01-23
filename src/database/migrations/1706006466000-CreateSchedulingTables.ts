import { MigrationInterface, QueryRunner, Table, TableIndex, TableForeignKey } from 'typeorm';

export class CreateSchedulingTables1706006466000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create teacher_availability table
        await queryRunner.createTable(
            new Table({
                name: 'teacher_availability',
                columns: [
                    {
                        name: 'id',
                        type: 'int',
                        isPrimary: true,
                        isGenerated: true,
                        generationStrategy: 'increment',
                    },
                    {
                        name: 'teacher_id',
                        type: 'int',
                    },
                    {
                        name: 'day_of_week',
                        type: 'tinyint',
                        comment: '0-6 (Sunday-Saturday)',
                    },
                    {
                        name: 'start_time',
                        type: 'time',
                    },
                    {
                        name: 'end_time',
                        type: 'time',
                    },
                    {
                        name: 'status',
                        type: 'enum',
                        enum: ['available', 'busy', 'preferred'],
                        default: "'available'",
                    },
                    {
                        name: 'repeat_pattern',
                        type: 'enum',
                        enum: ['weekly', 'once'],
                        default: "'weekly'",
                    },
                    {
                        name: 'created_at',
                        type: 'timestamp',
                        default: 'CURRENT_TIMESTAMP',
                    },
                    {
                        name: 'updated_at',
                        type: 'timestamp',
                        default: 'CURRENT_TIMESTAMP',
                        onUpdate: 'CURRENT_TIMESTAMP',
                    },
                ],
            }),
            true
        );

        // Create room_schedules table
        await queryRunner.createTable(
            new Table({
                name: 'room_schedules',
                columns: [
                    {
                        name: 'id',
                        type: 'int',
                        isPrimary: true,
                        isGenerated: true,
                        generationStrategy: 'increment',
                    },
                    {
                        name: 'room_id',
                        type: 'int',
                    },
                    {
                        name: 'date',
                        type: 'date',
                    },
                    {
                        name: 'start_time',
                        type: 'time',
                    },
                    {
                        name: 'end_time',
                        type: 'time',
                    },
                    {
                        name: 'status',
                        type: 'enum',
                        enum: ['booked', 'available', 'maintenance'],
                        default: "'available'",
                    },
                    {
                        name: 'created_at',
                        type: 'timestamp',
                        default: 'CURRENT_TIMESTAMP',
                    },
                    {
                        name: 'updated_at',
                        type: 'timestamp',
                        default: 'CURRENT_TIMESTAMP',
                        onUpdate: 'CURRENT_TIMESTAMP',
                    },
                ],
            }),
            true
        );

        // Create class_schedules table
        await queryRunner.createTable(
            new Table({
                name: 'class_schedules',
                columns: [
                    {
                        name: 'id',
                        type: 'int',
                        isPrimary: true,
                        isGenerated: true,
                        generationStrategy: 'increment',
                    },
                    {
                        name: 'class_id',
                        type: 'int',
                    },
                    {
                        name: 'room_id',
                        type: 'int',
                    },
                    {
                        name: 'teacher_id',
                        type: 'int',
                    },
                    {
                        name: 'day_of_week',
                        type: 'tinyint',
                        comment: '0-6 (Sunday-Saturday)',
                    },
                    {
                        name: 'start_time',
                        type: 'time',
                    },
                    {
                        name: 'end_time',
                        type: 'time',
                    },
                    {
                        name: 'start_date',
                        type: 'date',
                    },
                    {
                        name: 'end_date',
                        type: 'date',
                    },
                    {
                        name: 'created_at',
                        type: 'timestamp',
                        default: 'CURRENT_TIMESTAMP',
                    },
                    {
                        name: 'updated_at',
                        type: 'timestamp',
                        default: 'CURRENT_TIMESTAMP',
                        onUpdate: 'CURRENT_TIMESTAMP',
                    },
                ],
            }),
            true
        );

        // Create indices
        await queryRunner.createIndex(
            'teacher_availability',
            new TableIndex({
                name: 'IDX_TEACHER_AVAILABILITY_SEARCH',
                columnNames: ['teacher_id', 'day_of_week', 'status'],
            })
        );

        await queryRunner.createIndex(
            'room_schedules',
            new TableIndex({
                name: 'IDX_ROOM_SCHEDULE_SEARCH',
                columnNames: ['room_id', 'date', 'status'],
            })
        );

        await queryRunner.createIndex(
            'class_schedules',
            new TableIndex({
                name: 'IDX_CLASS_SCHEDULE_SEARCH',
                columnNames: ['class_id', 'day_of_week', 'start_date', 'end_date'],
            })
        );

        // Create foreign keys
        await queryRunner.createForeignKey(
            'teacher_availability',
            new TableForeignKey({
                name: 'FK_TEACHER_AVAILABILITY_TEACHER',
                columnNames: ['teacher_id'],
                referencedColumnNames: ['id'],
                referencedTableName: 'teachers',
                onDelete: 'CASCADE',
            })
        );

        await queryRunner.createForeignKey(
            'class_schedules',
            new TableForeignKey({
                name: 'FK_CLASS_SCHEDULE_CLASS',
                columnNames: ['class_id'],
                referencedColumnNames: ['id'],
                referencedTableName: 'classes',
                onDelete: 'CASCADE',
            })
        );

        await queryRunner.createForeignKey(
            'class_schedules',
            new TableForeignKey({
                name: 'FK_CLASS_SCHEDULE_TEACHER',
                columnNames: ['teacher_id'],
                referencedColumnNames: ['id'],
                referencedTableName: 'teachers',
                onDelete: 'RESTRICT',
            })
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop foreign keys
        await queryRunner.dropForeignKey('class_schedules', 'FK_CLASS_SCHEDULE_TEACHER');
        await queryRunner.dropForeignKey('class_schedules', 'FK_CLASS_SCHEDULE_CLASS');
        await queryRunner.dropForeignKey('teacher_availability', 'FK_TEACHER_AVAILABILITY_TEACHER');

        // Drop indices
        await queryRunner.dropIndex('class_schedules', 'IDX_CLASS_SCHEDULE_SEARCH');
        await queryRunner.dropIndex('room_schedules', 'IDX_ROOM_SCHEDULE_SEARCH');
        await queryRunner.dropIndex('teacher_availability', 'IDX_TEACHER_AVAILABILITY_SEARCH');

        // Drop tables
        await queryRunner.dropTable('class_schedules');
        await queryRunner.dropTable('room_schedules');
        await queryRunner.dropTable('teacher_availability');
    }
}