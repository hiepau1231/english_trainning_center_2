import {
  Repository,
  FindOneOptions,
  FindManyOptions,
  ObjectLiteral,
  QueryRunner,
  FindOptionsWhere,
  EntityTarget,
  DeepPartial
} from 'typeorm';

// Custom types for better type safety
type CacheOptions = {
  id: string;
  milliseconds: number;
};

type QueryOptions<T> = FindOneOptions<T> | FindManyOptions<T>;

/**
 * Interface defining the base repository operations
 */
export interface IBaseRepository<T extends ObjectLiteral> {
  // Basic CRUD
  create(data: DeepPartial<T>): Promise<T>;
  findById(id: number): Promise<T | null>;
  findOne(options: FindOneOptions<T>): Promise<T | null>;
  findAll(options?: FindManyOptions<T>): Promise<T[]>;
  update(id: number, data: DeepPartial<T>): Promise<T>;
  softDelete(id: number): Promise<void>;
  restore(id: number): Promise<T>;

  // Optimized operations
  bulkCreate(data: DeepPartial<T>[]): Promise<T[]>;
  bulkUpsert(data: DeepPartial<T>[], uniqueColumns: string[]): Promise<void>;
  findWithCache(options: FindOneOptions<T>): Promise<T | null>;
  findAllWithCache(options: FindManyOptions<T>): Promise<T[]>;
  clearCache(): Promise<void>;

  // Transaction support
  useTransaction(queryRunner: QueryRunner): void;
}

/**
 * Base repository implementation with common operations
 */
export abstract class BaseRepository<T extends ObjectLiteral> implements IBaseRepository<T> {
  private queryRunner: QueryRunner | null = null;
  private readonly cacheTimeout = 60000; // 1 minute cache

  protected constructor(
    protected readonly repository: Repository<T>
  ) {}

  /**
   * Sets the query runner for transaction support
   */
  useTransaction(queryRunner: QueryRunner): void {
    this.queryRunner = queryRunner;
  }

  /**
   * Gets the appropriate entity manager based on transaction context
   */
  protected get manager() {
    return this.queryRunner?.manager || this.repository.manager;
  }

  /**
   * Creates a new entity instance
   */
  async create(data: DeepPartial<T>): Promise<T> {
    const entity = this.repository.create(data);
    return await this.manager.save(this.repository.target, entity);
  }

  /**
   * Finds an entity by ID
   */
  async findById(id: number): Promise<T | null> {
    const where = {
      id: id as any
    } as unknown as FindOptionsWhere<T>;

    return await this.repository.findOne({
      where,
      cache: this.getCacheOptions(`${this.repository.metadata.tableName}:${id}`)
    });
  }

  /**
   * Finds a single entity by options
   */
  async findOne(options: FindOneOptions<T>): Promise<T | null> {
    return await this.repository.findOne({
      ...options,
      cache: this.getCacheOptions(this.getCacheKey(options))
    });
  }

  /**
   * Finds all entities matching options
   */
  async findAll(options?: FindManyOptions<T>): Promise<T[]> {
    return await this.repository.find({
      ...options,
      cache: this.getCacheOptions(this.getCacheKey(options))
    });
  }

  /**
   * Updates an entity by ID
   */
  async update(id: number, data: DeepPartial<T>): Promise<T> {
    await this.manager.update(this.repository.target, id, data as any);
    await this.clearCache();
    const updated = await this.findById(id);
    if (!updated) {
      throw new Error(`Entity with id ${id} not found`);
    }
    return updated;
  }

  /**
   * Soft deletes an entity
   */
  async softDelete(id: number): Promise<void> {
    await this.manager.softDelete(this.repository.target, id);
    await this.clearCache();
  }

  /**
   * Restores a soft-deleted entity
   */
  async restore(id: number): Promise<T> {
    await this.manager.restore(this.repository.target, id);
    await this.clearCache();
    const restored = await this.findById(id);
    if (!restored) {
      throw new Error(`Entity with id ${id} not found`);
    }
    return restored;
  }

  /**
   * Creates multiple entities in bulk
   */
  async bulkCreate(data: DeepPartial<T>[]): Promise<T[]> {
    if (!data.length) return [];
    
    const entities = this.repository.create(data);
    return await this.manager.save(this.repository.target, entities);
  }

  /**
   * Upserts multiple entities in bulk
   */
  async bulkUpsert(data: DeepPartial<T>[], uniqueColumns: string[]): Promise<void> {
    if (!data.length) return;

    const metadata = this.repository.metadata;
    const tableName = metadata.tableName;

    const queryBuilder = this.manager
      .createQueryBuilder()
      .insert()
      .into(tableName)
      .values(data as any[]);

    const nonUniqueColumns = Object.keys(data[0])
      .filter(key => !uniqueColumns.includes(key));

    if (nonUniqueColumns.length) {
      const updates = nonUniqueColumns.map(key => `${key} = VALUES(${key})`);
      await queryBuilder.orUpdate(updates).execute();
    } else {
      await queryBuilder.orIgnore().execute();
    }

    await this.clearCache();
  }

  /**
   * Finds a single entity with caching
   */
  async findWithCache(options: FindOneOptions<T>): Promise<T | null> {
    return await this.findOne(options);
  }

  /**
   * Finds all entities with caching
   */
  async findAllWithCache(options: FindManyOptions<T>): Promise<T[]> {
    return await this.findAll(options);
  }

  /**
   * Clears the query cache
   */
  async clearCache(): Promise<void> {
    await this.repository.manager.connection.queryResultCache?.clear();
  }

  /**
   * Generates cache options
   */
  private getCacheOptions(id: string): CacheOptions {
    return {
      id,
      milliseconds: this.cacheTimeout
    };
  }

  /**
   * Generates a cache key for query options
   */
  private getCacheKey(options: QueryOptions<T> | undefined): string {
    const tableName = this.repository.metadata.tableName;
    return `${tableName}:${JSON.stringify(options || {})}`;
  }
}