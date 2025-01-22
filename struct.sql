CREATE TABLE
  `class_schedules` (
    `schedule_id` int NOT NULL,
    `class_id` int NOT NULL,
    PRIMARY KEY (`schedule_id`, `class_id`),
    KEY `IDX_84c82d4a5d05bc421098e60ef8` (`schedule_id`),
    KEY `IDX_8311cc83d9350de70f2a77e8c5` (`class_id`)
  ) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;

CREATE TABLE
  `classes` (
    `id` int NOT NULL AUTO_INCREMENT,
    `class_name` varchar(255) NOT NULL,
    `start_date` date DEFAULT NULL,
    `end_date` date DEFAULT NULL,
    `is_deleted` tinyint NOT NULL DEFAULT '0',
    `created_at` datetime (6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    `updated_at` datetime (6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    `deleted_at` timestamp NULL DEFAULT NULL,
    `courseId` int DEFAULT NULL,
    `classroomId` int DEFAULT NULL,
    PRIMARY KEY (`id`)
  ) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;

CREATE TABLE
  `classrooms` (
    `id` int NOT NULL AUTO_INCREMENT,
    `room_name` varchar(255) NOT NULL,
    `capacity` int DEFAULT NULL,
    `is_deleted` tinyint NOT NULL DEFAULT '0',
    `created_at` datetime (6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    `updated_at` datetime (6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    `deleted_at` timestamp NULL DEFAULT NULL,
    PRIMARY KEY (`id`)
  ) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;

CREATE TABLE
  `courses` (
    `id` int NOT NULL AUTO_INCREMENT,
    `course_name` varchar(255) NOT NULL,
    `status` enum ('active', 'inactive', 'completed') NOT NULL DEFAULT 'active',
    `level` enum ('Beginner', 'Intermediate', 'Advanced') NOT NULL DEFAULT 'Beginner',
    `is_deleted` tinyint NOT NULL DEFAULT '0',
    `created_at` datetime (6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    `updated_at` datetime (6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    `deleted_at` timestamp NULL DEFAULT NULL,
    PRIMARY KEY (`id`)
  ) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;

CREATE TABLE
  `level` (
    `id` int NOT NULL AUTO_INCREMENT,
    `level_name` varchar(255) NOT NULL,
    `is_deleted` tinyint NOT NULL DEFAULT '0',
    `created_at` datetime (6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    `updated_at` datetime (6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    `deleted_at` timestamp NULL DEFAULT NULL,
    PRIMARY KEY (`id`)
  ) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;

CREATE TABLE
  `schedule_shifts` (
    `schedule_id` int NOT NULL,
    `shift_id` int NOT NULL,
    PRIMARY KEY (`schedule_id`, `shift_id`),
    KEY `IDX_5ba0219512b8ed3345fea01015` (`schedule_id`),
    KEY `IDX_e77a9f4fb7e92d5c6c38a92af0` (`shift_id`)
  ) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;

CREATE TABLE
  `schedules` (
    `id` int NOT NULL AUTO_INCREMENT,
    `schedule_date` date DEFAULT NULL,
    `is_deleted` tinyint NOT NULL DEFAULT '0',
    `created_at` datetime (6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    `updated_at` datetime (6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    `deleted_at` timestamp NULL DEFAULT NULL,
    `classroomId` int DEFAULT NULL,
    PRIMARY KEY (`id`)
  ) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;

CREATE TABLE
  `shifts` (
    `id` int NOT NULL AUTO_INCREMENT,
    `teaching_shift` varchar(255) NOT NULL,
    `is_deleted` tinyint NOT NULL DEFAULT '0',
    `created_at` datetime (6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    `updated_at` datetime (6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    `deleted_at` timestamp NULL DEFAULT NULL,
    `classId` int DEFAULT NULL,
    PRIMARY KEY (`id`)
  ) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;

CREATE TABLE
  `teacher_level` (
    `teacher_id` int NOT NULL,
    `level_id` int NOT NULL,
    PRIMARY KEY (`teacher_id`, `level_id`),
    KEY `IDX_cafbd5424ebf9217b8161c2578` (`teacher_id`),
    KEY `IDX_73bee7ba0a1bfcf6def0cb6d1a` (`level_id`)
  ) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;

CREATE TABLE
  `teachers` (
    `id` int NOT NULL AUTO_INCREMENT,
    `teacher_name` varchar(255) NOT NULL,
    `email` varchar(255) DEFAULT NULL,
    `is_foreign` tinyint NOT NULL DEFAULT '0',
    `is_Fulltime` tinyint NOT NULL DEFAULT '0',
    `is_Parttime` tinyint NOT NULL DEFAULT '0',
    `phone_number` varchar(255) DEFAULT NULL,
    `working_type_id` int DEFAULT NULL,
    `courses_level_id` int DEFAULT NULL,
    `is_deleted` tinyint NOT NULL DEFAULT '0',
    `created_at` datetime (6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    `updated_at` datetime (6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    `deleted_at` timestamp NULL DEFAULT NULL,
    PRIMARY KEY (`id`)
  ) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;

CREATE TABLE
  `class_teachers` (
    `id` int NOT NULL AUTO_INCREMENT,
    `class_id` int NOT NULL,
    `teacher_id` int NOT NULL,
    `role` enum ('Giáo Viên Chính', 'Giáo Viên Phụ') NOT NULL,
    `is_deleted` tinyint (1) NOT NULL DEFAULT '0',
    `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `deleted_at` timestamp NULL DEFAULT NULL,
    PRIMARY KEY (`id`),
    KEY `fk_class` (`class_id`),
    KEY `fk_teacher` (`teacher_id`),
    CONSTRAINT `fk_class` FOREIGN KEY (`class_id`) REFERENCES `classes` (`id`),
    CONSTRAINT `fk_teacher` FOREIGN KEY (`teacher_id`) REFERENCES `teachers` (`id`)
  ) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;