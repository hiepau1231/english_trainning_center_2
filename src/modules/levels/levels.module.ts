import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LevelsController } from './levels.controller';
import { LevelsService } from './levels.service';
import { Level } from './entities/level.entity';
import { LevelRepository } from './repositories/level.repository';

@Module({
  imports: [TypeOrmModule.forFeature([Level])],
  controllers: [LevelsController],
  providers: [LevelsService, LevelRepository],
  exports: [LevelsService, LevelRepository],
})
export class LevelsModule {}
