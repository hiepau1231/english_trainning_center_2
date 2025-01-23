# Bối Cảnh Kỹ Thuật

## Công Nghệ Sử Dụng

### Framework Cốt Lõi
- NestJS v10.0.0
- TypeScript v5.1.3
- Node.js v18+

### Cơ Sở Dữ Liệu
- MySQL
- TypeORM v0.3.20
- Query Builder optimization
- Cache layer integration

### Repository Infrastructure
```typescript
// Base Repository Pattern
- Generic type constraints
- Built-in caching
- Bulk operations
- Transaction support

// Entity Repositories
- Entity-specific optimizations
- Custom query methods
- Performance monitoring
```

### API & Xử Lý Dữ Liệu
- Express.js platform
- Class-validator & class-transformer
- DTO validation
- Multer for uploads

### Dependencies
```json
{
  "dependencies": {
    "@nestjs/common": "^10.0.0",
    "@nestjs/config": "^3.3.0",
    "@nestjs/typeorm": "^10.0.2",
    "mysql2": "^3.12.0",
    "typeorm": "^0.3.20",
    "bcrypt": "^5.1.1",
    "multer": "^1.4.5-lts.1",
    "class-validator": "^0.14.1",
    "class-transformer": "^0.5.1"
  }
}
```

## Thiết Lập Phát Triển

### Repository Setup
```typescript
// 1. Base Repository
import { BaseRepository } from '@common/repositories/base.repository';

// 2. Entity Repository
@Injectable()
export class EntityRepository extends BaseRepository<Entity> {
  constructor(
    @InjectRepository(Entity)
    repository: Repository<Entity>
  ) {
    super(repository);
  }
}

// 3. Service Integration
@Injectable()
export class EntityService {
  constructor(
    private readonly repository: EntityRepository
  ) {}
}
```

### Database Configuration
```typescript
// TypeORM Config
{
  type: 'mysql',
  cache: {
    type: 'database',
    duration: 60000 // 1 minute
  },
  logging: true,
  synchronize: false,
  migrations: ['dist/migrations/*.js']
}
```

### Development Scripts
```json
{
  "scripts": {
    "build": "nest build",
    "start": "nest start",
    "start:dev": "nest start --watch",
    "start:debug": "nest start --debug --watch",
    "start:prod": "node dist/main",
    "typeorm": "ts-node ./node_modules/typeorm/cli.js",
    "migration:create": "npm run typeorm migration:create",
    "migration:run": "npm run typeorm migration:run",
    "migration:revert": "npm run typeorm migration:revert"
  }
}
```

## Ràng Buộc Kỹ Thuật

### TypeORM & Database
```typescript
// 1. Entity Requirements
- Soft delete implementation
- Audit columns (created_at, updated_at)
- Proper indices
- Relationship management

// 2. Query Optimization
- Use query builder for complex queries
- Implement proper joins
- Utilize database indices
- Cache frequent queries
```

### Performance Requirements
```typescript
// 1. Caching Strategy
- Entity-level caching
- Query result caching
- Cache invalidation
- Memory management

// 2. Bulk Operations
- Batch processing
- Memory efficient
- Transaction support
- Error handling
```

### Type Safety
```typescript
// 1. Repository Types
- Generic constraints
- DTO validation
- Proper type inference
- Minimal type assertions

// 2. Error Handling
- Custom exceptions
- Type-safe error responses
- Proper error propagation
```

## Hướng Dẫn Triển Khai

### Repository Implementation
1. Extend BaseRepository
2. Implement entity-specific methods
3. Add caching where appropriate
4. Optimize bulk operations

### Service Layer
1. Use repository methods
2. Handle business logic
3. Manage transactions
4. Implement error handling

### Performance Monitoring
1. Query execution time
2. Cache hit rates
3. Memory usage
4. Response times

### Testing Requirements
1. Unit tests for repositories
2. Integration tests for services
3. Performance benchmarks
4. Cache validation tests