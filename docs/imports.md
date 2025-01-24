# Quy Ước Import Trong Project

## Cấu Trúc Path Alias

```typescript
// Cấu hình trong tsconfig.json
{
  "compilerOptions": {
    "paths": {
      "@modules/*": ["src/modules/*"],
      "@common/*": ["src/common/*"],
      "@config/*": ["src/config/*"],
      "@test/*": ["test/*"]
    }
  }
}
```

## Quy Tắc Import

### 1. Sử Dụng Path Alias
```typescript
// ✅ Đúng
import { ClassScheduleEntity } from '@modules/schedules/entities/class-schedule.entity';
import { BaseRepository } from '@common/repositories/base.repository';

// ❌ Sai
import { ClassScheduleEntity } from '../../entities/class-schedule.entity';
import { BaseRepository } from '../../../common/repositories/base.repository';
```

### 2. Import Từ Module

#### Entity Imports
```typescript
// Import entities
import { ClassEntity } from '@modules/classes/entities/class.entity';
import { TeacherEntity } from '@modules/teachers/entities/teacher.entity';
import { RoomEntity } from '@modules/rooms/entities/classroom.entity';
```

#### Repository Imports
```typescript
// Import repositories
import { ClassScheduleRepository } from '@modules/schedules/repositories/class-schedule.repository';
import { TeacherAvailabilityRepository } from '@modules/schedules/repositories/teacher-availability.repository';
```

#### Service Imports
```typescript
// Import services
import { SchedulingService } from '@modules/schedules/services/scheduling.service';
import { ClassesService } from '@modules/classes/classes.service';
```

#### DTO Imports
```typescript
// Import DTOs
import { CreateScheduleDto } from '@modules/schedules/dto/create-schedule.dto';
import { UpdateScheduleDto } from '@modules/schedules/dto/update-schedule.dto';
```

### 3. Import Từ Common

```typescript
// Import shared utilities
import { BaseRepository } from '@common/repositories/base.repository';
import { ValidatorUtil } from '@common/validators/validator.util';
```

### 4. Import Từ Config

```typescript
// Import configuration
import { MulterConfig } from '@config/multer.config';
```

### 5. Import Từ Test

```typescript
// Import test utilities
import { createTestingModule } from '@test/utils/module.util';
import { MockRepository } from '@test/mocks/repository.mock';
```

## Xử Lý Circular Dependencies

### 1. Phát Hiện Circular Dependencies
```typescript
// Ví dụ circular dependency:
// A.ts -> B.ts -> C.ts -> A.ts

// Có thể phát hiện bằng:
// - TypeScript build errors
// - NestJS circular dependency warnings
```

### 2. Giải Pháp
```typescript
// 1. Tách interface
interface ISchedule {
  // shared interface
}

// 2. Sử dụng forwardRef
@Injectable()
export class ServiceA {
  constructor(
    @Inject(forwardRef(() => ServiceB))
    private serviceB: ServiceB
  ) {}
}

// 3. Tái cấu trúc dependencies
// - Tạo service trung gian
// - Tách shared logic
// - Sử dụng events
```

## Tổ Chức Import

### 1. Thứ Tự Import
```typescript
// 1. External imports (NestJS, TypeORM, etc)
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

// 2. Path alias imports (@modules, @common, etc)
import { BaseRepository } from '@common/repositories/base.repository';
import { ClassEntity } from '@modules/classes/entities/class.entity';

// 3. Relative imports (hiếm khi sử dụng)
import { ScheduleType } from './types/schedule.type';
```

### 2. Grouping
```typescript
// Nhóm theo loại
import { Injectable, Controller, Get, Post } from '@nestjs/common'; // NestJS
import { Repository, EntityRepository } from 'typeorm';            // TypeORM

import { BaseRepository } from '@common/repositories/base.repository';     // Common
import { ValidatorUtil } from '@common/validators/validator.util';        // Common

import { ClassEntity } from '@modules/classes/entities/class.entity';     // Modules
import { TeacherEntity } from '@modules/teachers/entities/teacher.entity'; // Modules
```

## Best Practices

1. **Luôn Sử Dụng Path Alias**
   - Dễ bảo trì
   - Tránh relative paths
   - Rõ ràng về nguồn

2. **Tránh Import Wildcards**
```typescript
// ❌ Sai
import * as Entities from '@modules/schedules/entities';

// ✅ Đúng
import { ClassScheduleEntity } from '@modules/schedules/entities/class-schedule.entity';
```

3. **Import Interface và Type**
```typescript
// Nên đặt interfaces/types trong file riêng
import { ScheduleType } from '@modules/schedules/types/schedule.type';
import { IScheduleConflict } from '@modules/schedules/interfaces/schedule-conflict.interface';
```

4. **Module Boundaries**
```typescript
// Mỗi module nên có public API rõ ràng
// Export những gì cần thiết qua index.ts
export * from './entities';
export * from './dto';
export * from './services';
```

## Troubleshooting

1. **Path Alias Không Hoạt Động**
   - Kiểm tra tsconfig.json
   - Kiểm tra jest.config.js
   - Rebuild project

2. **Circular Dependencies**
   - Sử dụng forwardRef
   - Tái cấu trúc code
   - Tách shared logic

3. **Import Errors**
   - Kiểm tra đường dẫn
   - Kiểm tra exports
   - Kiểm tra module registration