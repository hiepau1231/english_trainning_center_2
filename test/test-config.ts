import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import * as dotenv from 'dotenv';
import { join } from 'path';

// Load test environment variables
dotenv.config({ path: join(__dirname, '../.env.test') });

export const testDbConfig: TypeOrmModuleOptions = {
  type: 'mysql',
  host: process.env.TEST_DB_HOST || 'localhost',
  port: parseInt(process.env.TEST_DB_PORT || '3306'),
  username: process.env.TEST_DB_USERNAME || 'test',
  password: process.env.TEST_DB_PASSWORD || 'test',
  database: process.env.TEST_DB_NAME || 'english_center_test',
  entities: [join(__dirname, '../src/**/*.entity{.ts,.js}')],
  synchronize: true,
  dropSchema: true, // Xóa và tạo lại schema cho mỗi lần test
};

// Seed data cho testing
export const testSeedData = {
  classes: [
    {
      id: 1,
      className: 'Test Class 1',
    },
  ],
  teachers: [
    {
      id: 1,
      teacher_name: 'Test Teacher 1',
      is_Fulltime: true,
    },
  ],
  rooms: [
    {
      id: 1,
      room_name: 'Test Room 1',
      capacity: 30,
    },
    {
      id: 2,
      room_name: 'Test Room 2',
      capacity: 25,
    },
  ],
};

// Helper functions cho testing
export const setupTestDb = async (connection: any) => {
  try {
    // Tạo test data
    await connection.getRepository('classes').save(testSeedData.classes);
    await connection.getRepository('teachers').save(testSeedData.teachers);
    await connection.getRepository('classrooms').save(testSeedData.rooms);

    console.log('Test database seeded successfully');
  } catch (error) {
    console.error('Error seeding test database:', error);
    throw error;
  }
};

// Helper function để cleanup test data
export const cleanupTestDb = async (connection: any) => {
  try {
    await connection.dropDatabase();
    console.log('Test database cleaned up successfully');
  } catch (error) {
    console.error('Error cleaning up test database:', error);
    throw error;
  }
};