import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Shift } from './entities/shift.entity';
import { CreateShiftDto } from './dto/create-shift.dto';

@Injectable()
export class ShiftsService {
  constructor(
    @InjectRepository(Shift)
    private shiftRepository: Repository<Shift>,
  ) {}

  async create(createShiftDto: CreateShiftDto) {
    const shift = this.shiftRepository.create(createShiftDto);
    return await this.shiftRepository.save(shift);
  }

  async findAll() {
    return await this.shiftRepository.find({
      where: { is_deleted: false },
      relations: ['class', 'schedules'],
    });
  }

  async findOne(id: number) {
    const shift = await this.shiftRepository.findOne({
      where: { id, is_deleted: false },
      relations: ['class', 'schedules'],
    });

    if (!shift) {
      throw new NotFoundException(`Shift with ID ${id} not found`);
    }

    return shift;
  }

  async update(id: number, updateShiftDto: Partial<CreateShiftDto>) {
    const shift = await this.findOne(id);
    Object.assign(shift, updateShiftDto);
    return await this.shiftRepository.save(shift);
  }

  async softDelete(id: number) {
    const shift = await this.findOne(id);
    shift.is_deleted = true;
    shift.deleted_at = new Date();
    return await this.shiftRepository.save(shift);
  }

  async restore(id: number) {
    const shift = await this.shiftRepository.findOne({
      where: { id, is_deleted: true },
    });

    if (!shift) {
      throw new NotFoundException(`Shift with ID ${id} not found`);
    }

    shift.is_deleted = false;
    shift.deleted_at = null;
    return await this.shiftRepository.save(shift);
  }
}
