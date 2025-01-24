import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../../src/app.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CreateScheduleDto } from '@modules/schedules/dto/create-schedule.dto';
import { UpdateScheduleDto } from '@modules/schedules/dto/update-schedule.dto';
import { Connection } from 'typeorm';
import { testDbConfig, setupTestDb, cleanupTestDb } from '../../test-config';

describe('Schedules (e2e)', () => {
  let app: INestApplication;
  let connection: Connection;
  let testScheduleId: number;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        AppModule,
        TypeOrmModule.forRoot(testDbConfig),
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    connection = moduleFixture.get(Connection);
    await setupTestDb(connection);
  });

  afterAll(async () => {
    await cleanupTestDb(connection);
    await app.close();
  });

  describe('/schedules/class (POST)', () => {
    it('nên tạo lịch học mới', async () => {
      const createDto: CreateScheduleDto = {
        classId: 1, // Sử dụng ID từ test seed data
        roomId: 1,  // Sử dụng ID từ test seed data
        teacherId: 1, // Sử dụng ID từ test seed data
        dayOfWeek: 1,
        startTime: '08:00',
        endTime: '10:00',
        startDate: new Date('2025-01-24'),
        endDate: new Date('2025-02-24'),
      };

      const response = await request(app.getHttpServer())
        .post('/schedules/class')
        .send(createDto)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      testScheduleId = response.body.data.id;
    });

    it('nên trả về lỗi khi tạo lịch học trùng', async () => {
      const conflictDto: CreateScheduleDto = {
        classId: 1,
        roomId: 1, // Cùng phòng
        teacherId: 1, // Cùng giáo viên
        dayOfWeek: 1,
        startTime: '09:00', // Thời gian chồng chéo
        endTime: '11:00',
        startDate: new Date('2025-01-24'),
        endDate: new Date('2025-02-24'),
      };

      const response = await request(app.getHttpServer())
        .post('/schedules/class')
        .send(conflictDto)
        .expect(200);

      expect(response.body.success).toBe(false);
      expect(response.body.conflicts).toBeDefined();
    });
  });

  describe('/schedules/available-slots (GET)', () => {
    it('nên tìm được các khung giờ trống', async () => {
      const response = await request(app.getHttpServer())
        .get('/schedules/available-slots')
        .query({
          teacherId: 1,
          rooms: '1,2', // Sử dụng ID từ test seed data
          startDate: '2025-01-24',
          endDate: '2025-02-24',
          preferredDays: '1,2,3,4,5'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  describe('/schedules/class/:id (GET)', () => {
    it('nên lấy được thông tin lịch học', async () => {
      const response = await request(app.getHttpServer())
        .get(`/schedules/class/${testScheduleId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.id).toBe(testScheduleId);
    });

    it('nên trả về lỗi khi không tìm thấy lịch học', async () => {
      const response = await request(app.getHttpServer())
        .get('/schedules/class/999')
        .expect(200);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Không tìm thấy lịch học cho lớp này');
    });
  });

  describe('/schedules/teacher/:id (GET)', () => {
    it('nên lấy được lịch dạy của giáo viên', async () => {
      const response = await request(app.getHttpServer())
        .get('/schedules/teacher/1') // Sử dụng ID từ test seed data
        .query({
          startDate: '2025-01-24',
          endDate: '2025-02-24'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
    });
  });

  describe('/schedules/room/:id (GET)', () => {
    it('nên lấy được lịch sử dụng của phòng', async () => {
      const response = await request(app.getHttpServer())
        .get('/schedules/room/1') // Sử dụng ID từ test seed data
        .query({
          startDate: '2025-01-24',
          endDate: '2025-02-24'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
    });
  });

  describe('/schedules/:id (PUT)', () => {
    it('nên cập nhật được lịch học', async () => {
      const updateDto: UpdateScheduleDto = {
        roomId: 2, // Sử dụng ID từ test seed data
        dayOfWeek: 2,
        startTime: '09:00',
        endTime: '11:00',
      };

      const response = await request(app.getHttpServer())
        .put(`/schedules/${testScheduleId}`)
        .send(updateDto)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.roomId).toBe(updateDto.roomId);
      expect(response.body.data.dayOfWeek).toBe(updateDto.dayOfWeek);
    });

    it('nên trả về lỗi khi cập nhật gây xung đột', async () => {
      const conflictDto: UpdateScheduleDto = {
        roomId: 1,
        dayOfWeek: 1,
        startTime: '08:00',
        endTime: '10:00',
      };

      const response = await request(app.getHttpServer())
        .put(`/schedules/${testScheduleId}`)
        .send(conflictDto)
        .expect(200);

      expect(response.body.success).toBe(false);
      expect(response.body.conflicts).toBeDefined();
    });
  });

  describe('/schedules/:id (DELETE)', () => {
    it('nên xóa được lịch học', async () => {
      const response = await request(app.getHttpServer())
        .delete(`/schedules/${testScheduleId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Đã xóa lịch học thành công');

      // Verify the schedule was actually deleted
      await request(app.getHttpServer())
        .get(`/schedules/class/${testScheduleId}`)
        .expect(200)
        .expect(res => {
          expect(res.body.success).toBe(false);
          expect(res.body.message).toBe('Không tìm thấy lịch học cho lớp này');
        });
    });
  });
});