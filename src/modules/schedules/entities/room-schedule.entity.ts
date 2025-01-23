import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Classroom } from '../../rooms/entities/classroom.entity';

export enum RoomStatus {
    BOOKED = 'booked',
    AVAILABLE = 'available',
    MAINTENANCE = 'maintenance'
}

@Entity('room_schedules')
export class RoomSchedule {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ name: 'room_id' })
    roomId: number;

    @ManyToOne(() => Classroom)
    @JoinColumn({ name: 'room_id' })
    room: Classroom;

    @Column({ type: 'date' })
    date: Date;

    @Column({ name: 'start_time', type: 'time' })
    startTime: string;

    @Column({ name: 'end_time', type: 'time' })
    endTime: string;

    @Column({
        type: 'enum',
        enum: RoomStatus,
        default: RoomStatus.AVAILABLE
    })
    status: RoomStatus;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;
}