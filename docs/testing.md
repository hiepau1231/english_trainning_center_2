# Hướng Dẫn Testing Chi Tiết

## Cấu Trúc Thư Mục Test

```
test/
├── unit/
│   └── schedules/
│       ├── repositories/
│       │   └── class-schedule.repository.spec.ts
│       └── services/
│           └── scheduling.service.spec.ts
└── e2e/
    └── schedules/
        └── schedules.e2e-spec.ts
```

## Test Repository

### Mẫu Test Repository
```typescript
describe('ClassScheduleRepository', () => {
  let repository: ClassScheduleRepository;
  let typeormRepository: Repository<ClassScheduleEntity>;

  beforeEach(async () => {
    // Thiết lập module test
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ClassScheduleRepository,
        {
          provide: getRepositoryToken(ClassScheduleEntity),
          useValue: createMock<Repository<ClassScheduleEntity>>()
        }
      ]
    }).compile();

    repository = module.get<ClassScheduleRepository>(ClassScheduleRepository);
    typeormRepository = module.get(getRepositoryToken(ClassScheduleEntity));
  });

  // Các test case
  describe('findConflicts', () => {
    it('nên trả về xung đột khi có lịch trùng', async () => {
      // Arrange
      const startDate = new Date();
      const endDate = new Date();
      
      // Act
      const conflicts = await repository.findConflicts(/*...*/);
      
      // Assert
      expect(conflicts).toBeDefined();
      expect(conflicts.length).toBeGreaterThan(0);
    });
  });
});
```

### Quy Tắc Test Repository
1. Mock TypeORM repository
2. Test CRUD operations
3. Test custom queries
4. Test error handling
5. Kiểm tra kết quả trả về

## Test Service

### Mẫu Test Service
```typescript
describe('SchedulingService', () => {
  let service: SchedulingService;
  let classScheduleRepo: ClassScheduleRepository;
  let teacherAvailabilityRepo: TeacherAvailabilityRepository;

  beforeEach(async () => {
    // Thiết lập module test
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SchedulingService,
        {
          provide: ClassScheduleRepository,
          useValue: createMock<ClassScheduleRepository>()
        },
        {
          provide: TeacherAvailabilityRepository,
          useValue: createMock<TeacherAvailabilityRepository>()
        }
      ]
    }).compile();

    service = module.get<SchedulingService>(SchedulingService);
    classScheduleRepo = module.get(ClassScheduleRepository);
    teacherAvailabilityRepo = module.get(TeacherAvailabilityRepository);
  });

  // Các test case
  describe('createClassSchedule', () => {
    it('nên tạo lịch học khi không có xung đột', async () => {
      // Arrange
      const dto = createTestScheduleDto();
      
      // Act
      const result = await service.createClassSchedule(dto);
      
      // Assert
      expect(result[0]).toBeDefined();
      expect(result[1]).toBeUndefined();
    });
  });
});
```

### Quy Tắc Test Service
1. Mock tất cả dependencies
2. Test business logic
3. Test error handling
4. Kiểm tra kết quả trả về
5. Test các trường hợp đặc biệt

## Test Controller

### Mẫu Test Controller
```typescript
describe('SchedulesController', () => {
  let controller: SchedulesController;
  let service: SchedulingService;

  beforeEach(async () => {
    // Thiết lập module test
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SchedulesController],
      providers: [
        {
          provide: SchedulingService,
          useValue: createMock<SchedulingService>()
        }
      ]
    }).compile();

    controller = module.get<SchedulesController>(SchedulesController);
    service = module.get<SchedulingService>(SchedulingService);
  });

  // Các test case
  describe('createClassSchedule', () => {
    it('nên tạo lịch học thành công', async () => {
      // Arrange
      const dto = createTestScheduleDto();
      
      // Act
      const result = await controller.createClassSchedule(dto);
      
      // Assert
      expect(result.success).toBe(true);
    });
  });
});
```

### Quy Tắc Test Controller
1. Mock service layer
2. Test request validation
3. Test response transformation
4. Test error handling
5. Kiểm tra HTTP status codes

## Mocking

### Quy Tắc Mock
1. Sử dụng `@nestjs/testing` để tạo TestingModule
2. Sử dụng `jest.createMockFromModule()` cho dependencies
3. Mock chỉ những method cần thiết
4. Clear mocks sau mỗi test

### Ví Dụ Mock Repository
```typescript
const mockRepository = {
  find: jest.fn(),
  findOne: jest.fn(),
  save: jest.fn(),
  create: jest.fn(),
  delete: jest.fn()
};
```

## Coverage Yêu Cầu

### Repository Layer
- Unit test coverage: > 90%
- Test tất cả custom queries
- Test error cases
- Test relationship loading

### Service Layer
- Unit test coverage: > 80%
- Test business logic
- Test validation rules
- Test error handling
- Test edge cases

### Controller Layer
- Unit test coverage: > 70%
- Test request validation
- Test response formats
- Test error responses
- Test success paths

## Best Practices

1. **Tổ Chức Test**
   - Mỗi file một test suite
   - Nhóm test cases theo chức năng
   - Đặt tên test rõ ràng

2. **Cấu Trúc Test Case**
   ```typescript
   it('nên [kết quả mong muốn] khi [điều kiện]', () => {
     // Arrange - chuẩn bị data
     // Act - thực thi method cần test
     // Assert - kiểm tra kết quả
   });
   ```

3. **Mock Data**
   - Tạo helper functions để tạo test data
   - Sử dụng factories nếu cần
   - Tránh duplicate test data

4. **Error Handling**
   - Test cả positive và negative cases
   - Verify error messages
   - Test error types

5. **Clean Up**
   - Reset mocks sau mỗi test
   - Clean up test data
   - Reset database state (nếu cần)

## Scripts Test

```bash
# Run unit tests
npm run test

# Run e2e tests
npm run test:e2e

# Check coverage
npm run test:cov
```

## Debugging Tests

1. Sử dụng Jest Debug Config trong VS Code
2. Set breakpoints trong test files
3. Sử dụng `console.log()` để debug
4. Check Jest output cho detailed failures