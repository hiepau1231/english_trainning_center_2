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

### Path Alias Configuration
```typescript
// tsconfig.json paths
{
  "@modules/*": ["src/modules/*"],
  "@common/*": ["src/common/*"],
  "@config/*": ["src/config/*"],
  "@test/*": ["test/*"]
}

// Jest module mapper
{
  "^@modules/(.*)$": "<rootDir>/src/modules/$1",
  "^@common/(.*)$": "<rootDir>/src/common/$1",
  "^@config/(.*)$": "<rootDir>/src/config/$1",
  "^@test/(.*)$": "<rootDir>/test/$1"
}

// Jest E2E module mapper
{
  "^@modules/(.*)$": "<rootDir>/../src/modules/$1",
  "^@common/(.*)$": "<rootDir>/../src/common/$1",
  "^@config/(.*)$": "<rootDir>/../src/config/$1",
  "^@test/(.*)$": "<rootDir>/$1"
}
```

### Testing Infrastructure
```typescript
// Jest Configuration
- Custom jest.config.js
- jest-e2e.json for e2e tests
- Path alias support
- TypeScript transformation
- Coverage reporting

// Test Structure
- Unit tests (/test/unit)
- E2E tests (/test/e2e)
- Repository tests
- Service tests
- Controller tests

// Test Database
- Separate test database
- Environment specific config
- Automated cleanup
- Test data seeding
```

### Dependencies
```json
{
  "dependencies": {
    "@nestjs/common": "^10.0.0",
    "@nestjs/config": "^3.3.0",
    "@nestjs/typeorm": "^10.0.2",
    "mysql2": "^3.12.0",
    "typeorm": "^0.3.20",
    "class-validator": "^0.14.1",
    "class-transformer": "^0.5.1"
  },
  "devDependencies": {
    "jest": "^29.5.0",
    "ts-jest": "^29.1.0",
    "supertest": "^7.0.0"
  }
}
```

## Thiết Lập Phát Triển

### Import Structure
```typescript
// Entity imports
import { Entity } from '@modules/domain/entities/entity';

// Repository imports
import { Repository } from '@modules/domain/repositories/repository';

// Service imports
import { Service } from '@modules/domain/services/service';
```

### Test Setup
```typescript
// Repository test template
describe('Repository', () => {
  let repository: Repository;
  let typeormRepository: TypeOrmRepository;

  beforeEach(async () => {
    // Test module setup
    // Repository initialization
    // Mock setup
  });

  // Test cases
});

// E2E test template
describe('API Endpoint', () => {
  let app: INestApplication;
  let connection: Connection;

  beforeAll(async () => {
    // Setup test module
    // Initialize app
    // Setup test database
  });

  afterAll(async () => {
    // Cleanup database
    // Close app
  });

  // Test cases
});
```

## Ràng Buộc Kỹ Thuật

### TypeORM & Database
```typescript
// 1. Entity Requirements
- Soft delete implementation
- Audit columns
- Proper indices
- Relationship management

// 2. Query Optimization
- Query builder usage
- Proper joins
- Index utilization
- Query caching
```

### Testing Requirements
```typescript
// 1. Unit Tests
- Repository operations
- Service logic
- Controller endpoints
- Error handling

// 2. E2E Tests
- API endpoints
- Database operations
- Full workflows
- Error scenarios

// 3. Test Database
- Separate config
- Clean state
- Seed data
- Automated cleanup
```

### Import Structure Rules
```typescript
// 1. Use Path Aliases
- @modules/* for module imports
- @common/* for shared code
- @config/* for configuration
- @test/* for test utilities

// 2. Avoid Relative Paths
- No ../../ style imports
- Clear module boundaries
- Proper encapsulation
```

## Hướng Dẫn Triển Khai

### Repository Implementation
1. Extend BaseRepository
2. Use path aliases for imports
3. Implement entity-specific methods
4. Add proper tests

### Service Layer
1. Use repository methods
2. Handle business logic
3. Proper error handling
4. Test coverage

### Testing Guidelines
1. Use path aliases
2. Mock external dependencies
3. Test error cases
4. Verify type safety

### Test Database Setup
1. Use .env.test config
2. Setup test schema
3. Seed test data
4. Implement cleanup

### Performance Monitoring
1. Query execution time
2. Cache hit rates
3. Memory usage
4. Response times

### Test Coverage Goals
1. Repository layer: > 90%
2. Service layer: > 80%
3. Controller layer: > 70%
4. Overall coverage: > 80%