import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum InterestRequestStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
}

@Entity('interest_requests')
export class InterestRequest {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  tenantId: number;

  @Column()
  ownerId: number;

  @Column()
  listingId: number;

  @Column({
    type: 'enum',
    enum: InterestRequestStatus,
    default: InterestRequestStatus.PENDING,
  })
  status: InterestRequestStatus;

  @Column({ nullable: true })
  conversationId: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
