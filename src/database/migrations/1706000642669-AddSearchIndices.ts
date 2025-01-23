import { MigrationInterface, QueryRunner, TableIndex } from "typeorm";

export class AddSearchIndices1706000642669 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        // Add index for Teacher.teacher_name
        await queryRunner.createIndex(
            "teachers",
            new TableIndex({
                name: "IDX_TEACHER_NAME",
                columnNames: ["teacher_name"]
            })
        );

        // Add index for Class.class_name
        await queryRunner.createIndex(
            "classes",
            new TableIndex({
                name: "IDX_CLASS_NAME",
                columnNames: ["class_name"]
            })
        );

        // Add index for Course.course_name
        await queryRunner.createIndex(
            "courses",
            new TableIndex({
                name: "IDX_COURSE_NAME",
                columnNames: ["course_name"]
            })
        );

        // Add index for Classroom.room_name
        await queryRunner.createIndex(
            "classrooms",
            new TableIndex({
                name: "IDX_ROOM_NAME",
                columnNames: ["room_name"]
            })
        );

        // Add index for Schedule.schedule_date
        await queryRunner.createIndex(
            "schedules",
            new TableIndex({
                name: "IDX_SCHEDULE_DATE",
                columnNames: ["schedule_date"]
            })
        );

        // Add index for Shift.teaching_shift
        await queryRunner.createIndex(
            "shifts",
            new TableIndex({
                name: "IDX_TEACHING_SHIFT",
                columnNames: ["teaching_shift"]
            })
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Remove all created indices
        await queryRunner.dropIndex("teachers", "IDX_TEACHER_NAME");
        await queryRunner.dropIndex("classes", "IDX_CLASS_NAME");
        await queryRunner.dropIndex("courses", "IDX_COURSE_NAME");
        await queryRunner.dropIndex("classrooms", "IDX_ROOM_NAME");
        await queryRunner.dropIndex("schedules", "IDX_SCHEDULE_DATE");
        await queryRunner.dropIndex("shifts", "IDX_TEACHING_SHIFT");
    }
}